import { ObjectId } from "mongodb";
import { database, ensureDatabaseReady } from "../config/db.js";
import { ApiError } from "../middleware/error-handler.js";

const products = () => database.collection("products");

export async function listProducts({ filter, page, limit, sort }) {
  await ensureDatabaseReady();
  const [items, total] = await Promise.all([
    products()
      .find(filter, { projection: { seedKey: 0 } })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    products().countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProduct(id) {
  await ensureDatabaseReady();
  const product = await products().findOne(
    { _id: new ObjectId(id) },
    { projection: { seedKey: 0 } },
  );
  if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  return product;
}

export async function listMyProducts(userId, { page, limit }) {
  await ensureDatabaseReady();
  const filter = { createdBy: userId };
  const [items, total] = await Promise.all([
    products()
      .find(filter, { projection: { seedKey: 0 } })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    products().countDocuments(filter),
  ]);
  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createProduct(input, userId) {
  await ensureDatabaseReady();
  const now = new Date();
  const document = {
    ...input,
    image: input.image ?? "",
    sizes: input.sizes ?? [],
    featured: input.featured ?? false,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };
  const result = await products().insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function updateProduct(id, input, userId) {
  await ensureDatabaseReady();
  const result = await products().findOneAndUpdate(
    { _id: new ObjectId(id), createdBy: userId },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after", projection: { seedKey: 0 } },
  );

  if (result) return result;

  const exists = await products().findOne({ _id: new ObjectId(id) }, { projection: { _id: 1 } });
  if (!exists) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  throw new ApiError(403, "FORBIDDEN", "You do not own this product.");
}

export async function deleteProduct(id, userId) {
  await ensureDatabaseReady();
  const result = await products().deleteOne({ _id: new ObjectId(id), createdBy: userId });
  if (result.deletedCount === 1) return;

  const exists = await products().findOne({ _id: new ObjectId(id) }, { projection: { _id: 1 } });
  if (!exists) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  throw new ApiError(403, "FORBIDDEN", "You do not own this product.");
}
