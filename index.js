import { createServer } from "node:http";
import { env } from "./src/config/env.js";
import { closeDatabase, connectDatabase } from "./src/config/db.js";
import { createApp } from "./src/app.js";

const app = createApp();
const server = createServer(app);

server.listen(env.port, "0.0.0.0", () => {
  console.log(`SABA MODEST API listening on port ${env.port}`);
});

try {
  await connectDatabase();
  console.log("MongoDB connection established");
} catch {
  console.error("MongoDB connection failed; database-backed requests are unavailable until it reconnects.");
}

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; shutting down`);

  const closeServer = new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  try {
    await Promise.all([closeServer, closeDatabase()]);
    process.exitCode = 0;
  } catch {
    console.error("Graceful shutdown failed");
    process.exitCode = 1;
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
