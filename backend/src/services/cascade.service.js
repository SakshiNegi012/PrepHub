import Goal from "../models/goal.model.js";
import Module from "../models/module.model.js";
import Topic from "../models/topic.model.js";
import Concept from "../models/concept.model.js";
import Resource from "../models/resource.model.js";
import PracticeItem from "../models/practiceItem.model.js";
import StudySession from "../models/studySession.model.js";

async function deleteConceptChildren(conceptId, userId) {
  await Promise.all([
    Resource.deleteMany({ conceptId, userId }),
    PracticeItem.deleteMany({ conceptId, userId }),
    StudySession.deleteMany({ conceptId, userId }),
  ]);
}

export async function deleteConceptCascade(conceptId, userId) {
  await deleteConceptChildren(conceptId, userId);
  return Concept.findOneAndDelete({ _id: conceptId, userId });
}

export async function deleteTopicCascade(topicId, userId) {
  const concepts = await Concept.find({ topicId, userId }).select("_id");
  await Promise.all(concepts.map((c) => deleteConceptChildren(c._id, userId)));
  await Concept.deleteMany({ topicId, userId });
  return Topic.findOneAndDelete({ _id: topicId, userId });
}

export async function deleteModuleCascade(moduleId, userId) {
  const topics = await Topic.find({ moduleId, userId }).select("_id");
  for (const topic of topics) {
    await deleteTopicCascade(topic._id, userId);
  }
  return Module.findOneAndDelete({ _id: moduleId, userId });
}

export async function deleteGoalCascade(goalId, userId) {
  const modules = await Module.find({ goalId, userId }).select("_id");
  for (const mod of modules) {
    await deleteModuleCascade(mod._id, userId);
  }
  await Resource.deleteMany({ goalId, userId });
  return Goal.findOneAndDelete({ _id: goalId, userId });
}
