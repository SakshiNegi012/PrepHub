import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createStudySession,
  getStudySessions,
  deleteStudySession,
} from "../controllers/studySession.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createStudySession);
router.get("/", getStudySessions);
router.delete("/:id", deleteStudySession);

export default router;
