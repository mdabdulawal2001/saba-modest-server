import { Router } from "express";
import {
  createProductHandler,
  deleteProductHandler,
  getOwnProducts,
  getProductById,
  getProducts,
  rejectUnknownManagementQueryParams,
  rejectUnknownQueryParams,
  updateProductHandler,
} from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

router.get("/", rejectUnknownQueryParams, getProducts);
router.get("/mine", requireAuth, rejectUnknownManagementQueryParams, getOwnProducts);
router.get("/:id", getProductById);
router.post("/", requireAuth, createProductHandler);
router.patch("/:id", requireAuth, updateProductHandler);
router.delete("/:id", requireAuth, deleteProductHandler);

export default router;
