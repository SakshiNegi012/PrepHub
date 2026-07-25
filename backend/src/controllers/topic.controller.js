import Topic from "../models/topic.model.js";
import Module from "../models/module.model.js";
import Concept from "../models/concept.model.js";
import { deleteTopicCascade } from "../services/cascade.service.js";
import { logActivity } from "../utils/helpers.js";

export const createTopic = async (req, res) => {
  const { moduleId } = req.params;
  const { title, order } = req.body;
  const userId = req.user.id;

  const moduleDoc = await Module.findOne({ _id: moduleId, userId });
  if (!moduleDoc) return res.status(404).json({ message: "Module not found" });

  try {
    const topic = await Topic.create({ moduleId, title, order: order ?? 0, userId });
    await logActivity(userId, "topic_created", `Added topic "${title}"`, topic._id, "Topic");
    return res.status(201).json({ topic });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTopicById = async (req, res) => {
  const { topicId } = req.params;
  const userId = req.user.id;

  try {
    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    const concepts = await Concept.find({ topicId, userId }).sort({ order: 1 });

    return res.status(200).json({ topic: { ...topic.toObject(), concepts } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTopic = async (req, res) => {
  const { topicId } = req.params;
  const userId = req.user.id;

  try {
    const topic = await Topic.findOneAndUpdate(
      { _id: topicId, userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    return res.status(200).json({ topic });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteTopic = async (req, res) => {
  const { topicId } = req.params;
  const userId = req.user.id;

  try {
    const topic = await deleteTopicCascade(topicId, userId);
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    return res.status(200).json({ message: "Topic deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
