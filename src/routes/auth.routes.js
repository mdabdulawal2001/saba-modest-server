import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();
router.all("/{*path}", toNodeHandler(auth));

export default router;
