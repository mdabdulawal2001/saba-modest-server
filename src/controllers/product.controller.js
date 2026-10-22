import { ApiError } from "../middleware/error-handler.js";
import { sendSuccess } from "../utils/api-response.js";
import { listMyProducts, listProducts, getProduct, createProduct, updateProduct, deleteProduct } from "../services/product.service.js";
import {
  validateListQuery,
  validateObjectId,
  validateProductBody,
} from "../validators/product.validator.js";

function validateManagementQuery(query) {
  const { page, limit } = validateListQuery(query);
  return { page, limit };
}

export async function getProducts(req, res) {
  const result = await listProducts(validateListQuery(req.query));
  return sendSuccess(res, result.items, 200, { pagination: result.pagination });
}

export async function getProductById(req, res) {
  validateObjectId(req.params.id);
  return sendSuccess(res, await getProduct(req.params.id));
}

export async function getOwnProducts(req, res) {
  const result = await listMyProducts(req.authUser.id, validateManagementQuery(req.query));
  return sendSuccess(res, result.items, 200, { pagination: result.pagination });
}

export async function createProductHandler(req, res) {
  const product = await createProduct(validateProductBody(req.body), req.authUser.id);
  return sendSuccess(res, product, 201);
}

export async function updateProductHandler(req, res) {
  validateObjectId(req.params.id);
  const input = validateProductBody(req.body, { partial: true });
  return sendSuccess(res, await updateProduct(req.params.id, input, req.authUser.id));
}

export async function deleteProductHandler(req, res) {
  validateObjectId(req.params.id);
  await deleteProduct(req.params.id, req.authUser.id);
  return sendSuccess(res, { deleted: true });
}

export function rejectUnknownQueryParams(req, res, next) {
  const allowed = new Set(["search", "category", "minPrice", "maxPrice", "sort", "page", "limit", "featured"]);
  const unknown = Object.keys(req.query).find((key) => !allowed.has(key));
  if (unknown) return next(new ApiError(400, "VALIDATION_ERROR", `Unknown query parameter: ${unknown}.`));
  return next();
}

export function rejectUnknownManagementQueryParams(req, res, next) {
  const unknown = Object.keys(req.query).find((key) => !["page", "limit"].includes(key));
  if (unknown) return next(new ApiError(400, "VALIDATION_ERROR", `Unknown query parameter: ${unknown}.`));
  return next();
}
