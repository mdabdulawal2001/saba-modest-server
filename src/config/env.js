import "dotenv/config";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function url(name, fallback) {
  const value = process.env[name]?.trim() || fallback;
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

const port = Number.parseInt(process.env.PORT || "5000", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const nodeEnv = process.env.NODE_ENV || "development";
if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error("NODE_ENV must be development, test, or production");
}

const authSecret = required("BETTER_AUTH_SECRET");
if (nodeEnv === "production" && authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters in production");
}
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together");
}

export const env = Object.freeze({
  port,
  nodeEnv,
  mongoUri: required("MONGODB_URI"),
  databaseName: process.env.DB_NAME?.trim() || "saba_modest_db",
  authSecret,
  authUrl: url("BETTER_AUTH_URL", `http://localhost:${port}`),
  googleClientId,
  googleClientSecret,
});
