import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createPracticeItem,
  getPracticeItems,
  updatePracticeItem,
  deletePracticeItem,
} from "../controllers/practiceItem.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createPracticeItem);
router.get("/", getPracticeItems);
router.put("/:id", updatePracticeItem);
router.delete("/:id", deletePracticeItem);

export default router;
