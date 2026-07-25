import StudySession from "../models/studySession.model.js";
import Concept from "../models/concept.model.js";
import { getConceptContext } from "../services/concept.service.js";
import { logActivity } from "../utils/helpers.js";

export const createStudySession = async (req, res) => {
  const userId = req.user.id;
  const { conceptId, duration, startedAt, endedAt } = req.body;

  if (!conceptId || duration == null) {
    return res.status(400).json({ message: "conceptId and duration are required" });
  }

  const concept = await Concept.findOne({ _id: conceptId, userId });
  if (!concept) return res.status(404).json({ message: "Concept not found" });

  try {
    const session = await StudySession.create({
      conceptId,
      duration,
      startedAt,
      endedAt: endedAt || new Date(),
      date: new Date(),
      userId,
    });

    await Concept.findOneAndUpdate(
      { _id: conceptId, userId },
      { lastStudiedAt: new Date() }
    );

    const ctx = await getConceptContext(conceptId, userId);
    await logActivity(
      userId,
      "study_session",
      `Studied ${ctx?.concept?.title} for ${duration} min`,
      session._id,
      "StudySession"
    );

    return res.status(201).json({ session });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getStudySessions = async (req, res) => {
  const userId = req.user.id;
  const { conceptId } = req.query;

  try {
    const filter = { userId };
    if (conceptId) filter.conceptId = conceptId;

    const sessions = await StudySession.find(filter).sort({ date: -1 });
    return res.status(200).json({ sessions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteStudySession = async (req, res) => {
  const userId = req.user.id;

  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.id, userId });
    if (!session) return res.status(404).json({ message: "Session not found" });
    return res.status(200).json({ message: "Session deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
