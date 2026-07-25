import Goal from "../models/goal.model.js";
import Module from "../models/module.model.js";
import Topic from "../models/topic.model.js";
import Concept from "../models/concept.model.js";
import Resource from "../models/resource.model.js";
import PracticeItem from "../models/practiceItem.model.js";
import StudySession from "../models/studySession.model.js";

export async function getConceptContext(conceptId, userId) {
  const concept = await Concept.findOne({ _id: conceptId, userId });
  if (!concept) return null;

  const topic = await Topic.findOne({ _id: concept.topicId, userId });
  if (!topic) return null;

  const moduleDoc = await Module.findOne({ _id: topic.moduleId, userId });
  if (!moduleDoc) return null;

  const goal = await Goal.findOne({ _id: moduleDoc.goalId, userId });
  if (!goal) return null;

  return {
    concept,
    topic,
    module: moduleDoc,
    goal,
    breadcrumb: {
      goalId: goal._id,
      goalTitle: goal.title,
      moduleId: moduleDoc._id,
      moduleTitle: moduleDoc.title,
      topicId: topic._id,
      topicTitle: topic.title,
      conceptId: concept._id,
      conceptTitle: concept.title,
    },
    conceptPath: `/goals/${goal._id}/modules/${moduleDoc._id}/topics/${topic._id}/concepts/${concept._id}`,
  };
}

export async function enrichConcept(concept, userId) {
  const ctx = await getConceptContext(concept._id, userId);
  if (!ctx) return null;

  const [resourceCount, practiceCount, sessions] = await Promise.all([
    Resource.countDocuments({ conceptId: concept._id, userId }),
    PracticeItem.countDocuments({ conceptId: concept._id, userId }),
    StudySession.find({ conceptId: concept._id, userId }),
  ]);

  const totalMinutesStudied = sessions.reduce((sum, s) => sum + s.duration, 0);

  let lastResource = null;
  if (concept.lastOpenedResourceId) {
    lastResource = await Resource.findOne({
      _id: concept.lastOpenedResourceId,
      userId,
    });
  }

  return {
    ...concept.toObject(),
    resourceCount,
    practiceCount,
    totalMinutesStudied,
    breadcrumb: ctx.breadcrumb,
    conceptPath: ctx.conceptPath,
    lastResource: lastResource
      ? { _id: lastResource._id, title: lastResource.title, type: lastResource.type }
      : null,
  };
}

export async function enrichConcepts(concepts, userId) {
  const enriched = await Promise.all(concepts.map((c) => enrichConcept(c, userId)));
  return enriched.filter(Boolean);
}

export async function getModuleConceptStats(moduleId, userId) {
  const topics = await Topic.find({ moduleId, userId });
  const topicIds = topics.map((t) => t._id);
  const concepts = await Concept.find({ topicId: { $in: topicIds }, userId });

  const touched = concepts.filter(
    (c) => c.status !== "not_started" || c.lastStudiedAt
  ).length;

  return { total: concepts.length, touched };
}
