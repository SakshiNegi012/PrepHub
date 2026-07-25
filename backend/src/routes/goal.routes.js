import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} from "../controllers/goal.controller.js";
import {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
} from "../controllers/module.controller.js";
import {
  createTopic,
  getTopicById,
  updateTopic,
  deleteTopic,
} from "../controllers/topic.controller.js";
import {
  createConcept,
  getConceptById,
  updateConcept,
  touchConcept,
  deleteConcept,
} from "../controllers/concept.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createGoal);
router.get("/", getGoals);
router.get("/:id", getGoalById);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);

router.post("/:goalId/modules", createModule);
router.get("/:goalId/modules", getModules);
router.get("/:goalId/modules/:moduleId", getModuleById);
router.put("/:goalId/modules/:moduleId", updateModule);
router.delete("/:goalId/modules/:moduleId", deleteModule);

router.post("/:goalId/modules/:moduleId/topics", createTopic);
router.get("/:goalId/modules/:moduleId/topics/:topicId", getTopicById);
router.put("/:goalId/modules/:moduleId/topics/:topicId", updateTopic);
router.delete("/:goalId/modules/:moduleId/topics/:topicId", deleteTopic);

router.post("/:goalId/modules/:moduleId/topics/:topicId/concepts", createConcept);
router.get("/:goalId/modules/:moduleId/topics/:topicId/concepts/:conceptId", getConceptById);
router.put("/:goalId/modules/:moduleId/topics/:topicId/concepts/:conceptId", updateConcept);
router.post("/:goalId/modules/:moduleId/topics/:topicId/concepts/:conceptId/touch", touchConcept);
router.delete("/:goalId/modules/:moduleId/topics/:topicId/concepts/:conceptId", deleteConcept);

export default router;
