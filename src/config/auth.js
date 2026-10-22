import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { env } from "./env.js";
import { database } from "./db.js";

const socialProviders =
  env.googleClientId && env.googleClientSecret
    ? {
        google: {
          clientId: env.googleClientId,
          clientSecret: env.googleClientSecret,
        },
      }
    : undefined;

export const auth = betterAuth({
  appName: "SABA MODEST",
  baseURL: env.authUrl,
  secret: env.authSecret,
  database: mongodbAdapter(database),
  trustedOrigins: [env.authUrl],
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  ...(socialProviders ? { socialProviders } : {}),
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: env.nodeEnv === "production" ? "none" : "lax",
      secure: env.nodeEnv === "production",
    },
  },
});
