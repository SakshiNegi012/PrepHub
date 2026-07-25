import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getHome, search } from "../controllers/home.controller.js";

const router = express.Router();

router.get("/", protect, getHome);
router.get("/search", protect, search);

export default router;
