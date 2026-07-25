import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createResource,
  getResources,
  getResourceById,
  openResource,
  updateResource,
  deleteResource,
} from "../controllers/resource.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createResource);
router.get("/", getResources);
router.get("/:id", getResourceById);
router.post("/:id/open", openResource);
router.put("/:id", updateResource);
router.delete("/:id", deleteResource);

export default router;
