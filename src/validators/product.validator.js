import { ApiError } from "../middleware/error-handler.js";

export const PRODUCT_CATEGORIES = ["Casual", "Premium", "Party Wear"];
const writableFields = new Set([
  "title",
  "shortDescription",
  "description",
  "price",
  "category",
  "image",
  "sizes",
  "stock",
  "featured",
]);
const requiredOnCreate = [
  "title",
  "shortDescription",
  "description",
  "price",
  "category",
  "stock",
];

function invalid(message) {
  throw new ApiError(400, "VALIDATION_ERROR", message);
}

function validateField(field, value) {
  if (["title", "shortDescription", "description"].includes(field)) {
    const max = field === "description" ? 5000 : 200;
    if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
      invalid(`${field} must be a non-empty string of at most ${max} characters.`);
    }
    return value.trim();
  }

  if (field === "price") {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 10000000) {
      invalid("price must be a positive number no greater than 10000000 BDT.");
    }
    return value;
  }

  if (field === "category") {
    if (!PRODUCT_CATEGORIES.includes(value)) {
      invalid(`category must be one of: ${PRODUCT_CATEGORIES.join(", ")}.`);
    }
    return value;
  }

  if (field === "image") {
    if (typeof value !== "string" || value.length > 2048) {
      invalid("image must be a URL string or an empty string.");
    }
    if (value && !/^https?:\/\/\S+$/i.test(value)) {
      invalid("image must be an absolute HTTP or HTTPS URL.");
    }
    return value;
  }

  if (field === "sizes") {
    if (
      !Array.isArray(value) ||
      value.length > 20 ||
      value.some((size) => typeof size !== "string" || !size.trim() || size.trim().length > 30)
    ) {
      invalid("sizes must be an array of at most 20 non-empty strings.");
    }
    return [...new Set(value.map((size) => size.trim()))];
  }

  if (field === "stock") {
    if (!Number.isInteger(value) || value < 0 || value > 10000000) {
      invalid("stock must be a non-negative integer no greater than 10000000.");
    }
    return value;
  }

  if (field === "featured") {
    if (typeof value !== "boolean") invalid("featured must be a boolean.");
    return value;
  }

  invalid(`Invalid product field: ${field}.`);
}

export function validateProductBody(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    invalid("Request body must be a JSON object.");
  }

  const keys = Object.keys(body);
  if (!keys.length) invalid("At least one product field is required.");

  for (const key of keys) {
    if (!writableFields.has(key)) invalid(`Field ${key} cannot be set.`);
  }

  if (!partial) {
    for (const field of requiredOnCreate) {
      if (!Object.hasOwn(body, field)) invalid(`${field} is required.`);
    }
  }

  return Object.fromEntries(keys.map((key) => [key, validateField(key, body[key])]));
}

function parseBoundedInteger(value, name, defaultValue, max) {
  if (value === undefined) return defaultValue;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    invalid(`${name} must be a positive integer.`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > max) {
    invalid(`${name} must be between 1 and ${max}.`);
  }
  return number;
}

export function validateListQuery(query) {
  const page = parseBoundedInteger(query.page, "page", 1, 1000000);
  const limit = parseBoundedInteger(query.limit, "limit", 12, 50);
  const filter = {};

  if (query.search !== undefined) {
    if (typeof query.search !== "string" || query.search.trim().length > 100) {
      invalid("search must be at most 100 characters.");
    }
    if (query.search.trim()) {
      const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escaped, $options: "i" };
    }
  }

  if (query.category !== undefined) {
    if (!PRODUCT_CATEGORIES.includes(query.category)) {
      invalid(`category must be one of: ${PRODUCT_CATEGORIES.join(", ")}.`);
    }
    filter.category = query.category;
  }

  const parsePrice = (value) => {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) return Number.NaN;
    return Number(value);
  };
  const minPrice = parsePrice(query.minPrice);
  const maxPrice = parsePrice(query.maxPrice);
  if (
    (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
    (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0))
  ) {
    invalid("minPrice and maxPrice must be non-negative numbers.");
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    invalid("minPrice cannot be greater than maxPrice.");
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
    };
  }

  if (query.featured !== undefined) {
    if (!["true", "false"].includes(query.featured)) {
      invalid("featured must be true or false.");
    }
    filter.featured = query.featured === "true";
  }

  const sortMap = {
    price_asc: { price: 1, _id: 1 },
    price_desc: { price: -1, _id: 1 },
  };
  if (query.sort !== undefined && !Object.hasOwn(sortMap, query.sort)) {
    invalid("sort must be price_asc or price_desc.");
  }

  return {
    filter,
    page,
    limit,
    sort: sortMap[query.sort] || { createdAt: -1, _id: -1 },
  };
}

export function validateObjectId(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) invalid("id must be a valid MongoDB ObjectId.");
}
