import { MongoClient } from "mongodb";
import { env } from "./env.js";

export const mongoClient = new MongoClient(env.mongoUri, {
  serverSelectionTimeoutMS: 5000,
});
export const database = mongoClient.db(env.databaseName);
let indexesReady = false;

export async function connectDatabase() {
  await ensureDatabaseReady();
}

export async function ensureDatabaseReady() {
  await mongoClient.connect();
  await database.command({ ping: 1 });
  if (!indexesReady) {
    await ensureIndexes();
    indexesReady = true;
  }
}

export async function checkDatabase() {
  await ensureDatabaseReady();
}

export async function closeDatabase() {
  await mongoClient.close();
}

async function ensureIndexes() {
  const products = database.collection("products");
  await Promise.all([
    products.createIndex({ createdBy: 1, createdAt: -1 }),
    products.createIndex({ category: 1, price: 1 }),
    products.createIndex({ featured: 1 }),
    products.createIndex(
      { seedKey: 1 },
      { unique: true, partialFilterExpression: { seedKey: { $type: "string" } } },
    ),
  ]);
}
