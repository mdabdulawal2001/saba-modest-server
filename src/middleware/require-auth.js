import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user?.id) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Authentication is required." },
      });
    }

    req.authUser = { id: session.user.id };
    return next();
  } catch {
    return res.status(503).json({
      success: false,
      error: { code: "AUTH_UNAVAILABLE", message: "Authentication could not be verified." },
    });
  }
}
