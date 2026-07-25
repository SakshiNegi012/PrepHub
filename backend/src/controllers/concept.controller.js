import Concept from "../models/concept.model.js";
import Topic from "../models/topic.model.js";
import Resource from "../models/resource.model.js";
import PracticeItem from "../models/practiceItem.model.js";
import StudySession from "../models/studySession.model.js";
import Activity from "../models/activity.model.js";
import {
  enrichConcept,
  getConceptContext,
} from "../services/concept.service.js";
import { deleteConceptCascade } from "../services/cascade.service.js";
import { logActivity } from "../utils/helpers.js";

export const createConcept = async (req, res) => {
  const { topicId } = req.params;
  const { title, order } = req.body;
  const userId = req.user.id;

  const topic = await Topic.findOne({ _id: topicId, userId });
  if (!topic) return res.status(404).json({ message: "Topic not found" });

  try {
    const concept = await Concept.create({
      topicId,
      title,
      order: order ?? 0,
      userId,
    });

    await logActivity(
      userId,
      "concept_created",
      `Added concept "${title}"`,
      concept._id,
      "Concept"
    );

    const enriched = await enrichConcept(concept, userId);
    return res.status(201).json({ concept: enriched });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getConceptById = async (req, res) => {
  const { conceptId } = req.params;
  const userId = req.user.id;

  try {
    const concept = await Concept.findOne({ _id: conceptId, userId });
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    const ctx = await getConceptContext(conceptId, userId);
    const enriched = await enrichConcept(concept, userId);

    const [resources, practice, sessions, history] = await Promise.all([
      Resource.find({ conceptId, userId }).sort({ lastOpenedAt: -1 }),
      PracticeItem.find({ conceptId, userId }).sort({ createdAt: -1 }),
      StudySession.find({ conceptId, userId }).sort({ date: -1 }).limit(20),
      Activity.find({
        userId,
        referenceId: conceptId,
        referenceType: "Concept",
      })
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    return res.status(200).json({
      concept: enriched,
      context: ctx,
      resources,
      practice,
      sessions,
      history,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateConcept = async (req, res) => {
  const { conceptId } = req.params;
  const userId = req.user.id;
  const { title, order, status, personalNotes, revisionDueAt } = req.body;

  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (order !== undefined) updateData.order = order;
    if (status !== undefined) updateData.status = status;
    if (personalNotes !== undefined) updateData.personalNotes = personalNotes;
    if (revisionDueAt !== undefined) updateData.revisionDueAt = revisionDueAt;

    if (status === "needs_revision" && revisionDueAt === undefined) {
      const due = new Date();
      due.setDate(due.getDate() + 3);
      updateData.revisionDueAt = due;
    }
    if (status === "comfortable") {
      updateData.revisionDueAt = null;
    }

    const concept = await Concept.findOneAndUpdate(
      { _id: conceptId, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!concept) return res.status(404).json({ message: "Concept not found" });

    if (status !== undefined) {
      await logActivity(
        userId,
        "concept_status_changed",
        `Marked "${concept.title}" as ${status.replace("_", " ")}`,
        concept._id,
        "Concept"
      );
    }

    const enriched = await enrichConcept(concept, userId);
    return res.status(200).json({ concept: enriched });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const touchConcept = async (req, res) => {
  const { conceptId } = req.params;
  const userId = req.user.id;
  const { resourceId } = req.body;

  try {
    const updateData = { lastStudiedAt: new Date() };
    if (resourceId) updateData.lastOpenedResourceId = resourceId;

    const concept = await Concept.findOneAndUpdate(
      { _id: conceptId, userId },
      updateData,
      { new: true }
    );

    if (!concept) return res.status(404).json({ message: "Concept not found" });

    if (concept.status === "not_started") {
      concept.status = "learning";
      await concept.save();
    }

    const enriched = await enrichConcept(concept, userId);
    return res.status(200).json({ concept: enriched });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteConcept = async (req, res) => {
  const { conceptId } = req.params;
  const userId = req.user.id;

  try {
    const concept = await deleteConceptCascade(conceptId, userId);
    if (!concept) return res.status(404).json({ message: "Concept not found" });
    return res.status(200).json({ message: "Concept deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
