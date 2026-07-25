import Module from "../models/module.model.js";
import Goal from "../models/goal.model.js";
import Topic from "../models/topic.model.js";
import Concept from "../models/concept.model.js";
import { getModuleConceptStats } from "../services/concept.service.js";
import { deleteModuleCascade } from "../services/cascade.service.js";
import { logActivity } from "../utils/helpers.js";

export const createModule = async (req, res) => {
  const { goalId } = req.params;
  const { title, order, icon, color } = req.body;
  const userId = req.user.id;

  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) return res.status(404).json({ message: "Goal not found" });

  try {
    const moduleDoc = await Module.create({
      goalId,
      title,
      order: order ?? 0,
      icon,
      color,
      userId,
    });

    await logActivity(userId, "module_created", `Added module "${title}"`, moduleDoc._id, "Module");

    return res.status(201).json({ module: moduleDoc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getModules = async (req, res) => {
  const { goalId } = req.params;
  const userId = req.user.id;

  try {
    const modules = await Module.find({ goalId, userId }).sort({ order: 1 });
    const withStats = await Promise.all(
      modules.map(async (mod) => {
        const stats = await getModuleConceptStats(mod._id, userId);
        return { ...mod.toObject(), touched: stats.touched, total: stats.total };
      })
    );
    return res.status(200).json({ modules: withStats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getModuleById = async (req, res) => {
  const { goalId, moduleId } = req.params;
  const userId = req.user.id;

  try {
    const moduleDoc = await Module.findOne({ _id: moduleId, goalId, userId });
    if (!moduleDoc) return res.status(404).json({ message: "Module not found" });

    const topics = await Topic.find({ moduleId, userId }).sort({ order: 1 });
    const topicsWithStats = await Promise.all(
      topics.map(async (topic) => {
        const concepts = await Concept.find({ topicId: topic._id, userId });
        const touched = concepts.filter((c) => c.status !== "not_started" || c.lastStudiedAt).length;
        return { ...topic.toObject(), conceptCount: concepts.length, touched };
      })
    );

    const stats = await getModuleConceptStats(moduleId, userId);

    return res.status(200).json({
      module: { ...moduleDoc.toObject(), ...stats, topics: topicsWithStats },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateModule = async (req, res) => {
  const { moduleId } = req.params;
  const userId = req.user.id;
  const { title, order, icon, color } = req.body;

  try {
    const moduleDoc = await Module.findOneAndUpdate(
      { _id: moduleId, userId },
      { title, order, icon, color },
      { new: true, runValidators: true }
    );

    if (!moduleDoc) return res.status(404).json({ message: "Module not found" });
    return res.status(200).json({ module: moduleDoc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteModule = async (req, res) => {
  const { moduleId } = req.params;
  const userId = req.user.id;

  try {
    const moduleDoc = await deleteModuleCascade(moduleId, userId);
    if (!moduleDoc) return res.status(404).json({ message: "Module not found" });
    return res.status(200).json({ message: "Module deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
