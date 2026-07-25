import Goal from "../models/goal.model.js";
import Module from "../models/module.model.js";
import { getModuleConceptStats } from "../services/concept.service.js";
import { deleteGoalCascade } from "../services/cascade.service.js";
import { logActivity } from "../utils/helpers.js";

export const createGoal = async (req, res) => {
  const { title, description, targetDate, status } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ message: "Title is required." });
  }

  try {
    const goal = await Goal.create({
      title,
      description: description || "",
      targetDate,
      status: status || "active",
      userId,
    });

    await logActivity(userId, "goal_created", `Created goal "${title}"`, goal._id, "Goal");

    return res.status(201).json({ message: "Goal created successfully.", goal });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await Goal.find({ userId }).sort({ updatedAt: -1 });

    const goalsWithModules = await Promise.all(
      goals.map(async (goal) => {
        const modules = await Module.find({ goalId: goal._id, userId }).sort({ order: 1 });
        const moduleSummaries = await Promise.all(
          modules.map(async (mod) => {
            const stats = await getModuleConceptStats(mod._id, userId);
            return {
              _id: mod._id,
              title: mod.title,
              icon: mod.icon,
              color: mod.color,
              touched: stats.touched,
              total: stats.total,
            };
          })
        );
        return { ...goal.toObject(), modules: moduleSummaries };
      })
    );

    return res.status(200).json({ goals: goalsWithModules });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGoalById = async (req, res) => {
  try {
    const userId = req.user.id;
    const goal = await Goal.findOne({ _id: req.params.id, userId });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const modules = await Module.find({ goalId: goal._id, userId }).sort({ order: 1 });
    const moduleSummaries = await Promise.all(
      modules.map(async (mod) => {
        const stats = await getModuleConceptStats(mod._id, userId);
        return { ...mod.toObject(), touched: stats.touched, total: stats.total };
      })
    );

    return res.status(200).json({ goal: { ...goal.toObject(), modules: moduleSummaries } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateGoal = async (req, res) => {
  const { title, description, targetDate, status } = req.body;
  const userId = req.user.id;

  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (targetDate !== undefined) updateData.targetDate = targetDate;
    if (status !== undefined) updateData.status = status;

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    return res.status(200).json({ message: "Goal updated successfully", goal });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goal = await deleteGoalCascade(req.params.id, userId);

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    return res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
