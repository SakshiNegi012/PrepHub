import PracticeItem from "../models/practiceItem.model.js";
import Concept from "../models/concept.model.js";
import { getConceptContext } from "../services/concept.service.js";
import { logActivity } from "../utils/helpers.js";

export const createPracticeItem = async (req, res) => {
  const userId = req.user.id;
  const { conceptId, title, type } = req.body;

  if (!conceptId || !title) {
    return res.status(400).json({ message: "conceptId and title are required" });
  }

  const concept = await Concept.findOne({ _id: conceptId, userId });
  if (!concept) return res.status(404).json({ message: "Concept not found" });

  try {
    const item = await PracticeItem.create({
      conceptId,
      title,
      type,
      userId,
    });

    const ctx = await getConceptContext(conceptId, userId);
    await logActivity(
      userId,
      "practice_added",
      `Added practice "${title}" to ${ctx?.concept?.title || "concept"}`,
      item._id,
      "PracticeItem"
    );

    return res.status(201).json({ practiceItem: item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPracticeItems = async (req, res) => {
  const userId = req.user.id;
  const { conceptId } = req.query;

  try {
    const filter = { userId };
    if (conceptId) filter.conceptId = conceptId;

    const items = await PracticeItem.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ practiceItems: items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePracticeItem = async (req, res) => {
  const userId = req.user.id;

  try {
    const item = await PracticeItem.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: "Practice item not found" });

    if (item.status === "completed") {
      const ctx = await getConceptContext(item.conceptId, userId);
      await logActivity(
        userId,
        "practice_completed",
        `Completed practice "${item.title}" in ${ctx?.concept?.title}`,
        item._id,
        "PracticeItem"
      );
    }

    return res.status(200).json({ practiceItem: item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deletePracticeItem = async (req, res) => {
  const userId = req.user.id;

  try {
    const item = await PracticeItem.findOneAndDelete({ _id: req.params.id, userId });
    if (!item) return res.status(404).json({ message: "Practice item not found" });
    return res.status(200).json({ message: "Practice item deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
