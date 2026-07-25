import Goal from "../models/goal.model.js";
import Module from "../models/module.model.js";
import Topic from "../models/topic.model.js";
import Concept from "../models/concept.model.js";
import Resource from "../models/resource.model.js";
import PracticeItem from "../models/practiceItem.model.js";
import StudySession from "../models/studySession.model.js";
import { enrichConcept, enrichConcepts, getModuleConceptStats } from "../services/concept.service.js";
import { daysAgo, startOfDay } from "../utils/helpers.js";

const QUOTES = [
  "Small steps, every day, add up to something remarkable.",
  "You don't have to be perfect — you just have to show up.",
  "Learning is a journey. Rest when you need to, then continue.",
  "Focus on understanding one concept at a time.",
  "Progress isn't always visible, but it's always happening.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function pickQuote(userId) {
  const idx = userId.toString().charCodeAt(userId.toString().length - 1) % QUOTES.length;
  return QUOTES[idx];
}

export const getHome = async (req, res) => {
  try {
    const userId = req.user.id;

    const [recentConcepts, activeGoals, sessions, recentResources] = await Promise.all([
      Concept.find({
        userId,
        lastStudiedAt: { $exists: true },
      })
        .sort({ lastStudiedAt: -1 })
        .limit(3),
      Goal.find({ userId, status: "active" }),
      StudySession.find({
        userId,
        date: { $gte: daysAgo(6) },
      }),
      Resource.find({ userId, lastOpenedAt: { $exists: true } })
        .sort({ lastOpenedAt: -1 })
        .limit(6),
    ]);

    const continueItems = await enrichConcepts(recentConcepts, userId);

    let recommendedConcept = await Concept.findOne({
      userId,
      status: "needs_revision",
    }).sort({ revisionDueAt: 1 });

    if (!recommendedConcept) {
      recommendedConcept = await Concept.findOne({
        userId,
        status: { $in: ["learning", "not_started"] },
      }).sort({ lastStudiedAt: 1 });
    }

    let todayPractice = [];
    let todayConcept = null;

    if (recommendedConcept) {
      todayConcept = await enrichConcept(recommendedConcept, userId);
      todayPractice = await PracticeItem.find({
        conceptId: recommendedConcept._id,
        userId,
        status: { $ne: "completed" },
      }).limit(2);
    }

    const studiedDays = new Set(
      sessions.map((s) => startOfDay(s.date).toISOString())
    );

    const rhythm = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(new Date());
      day.setDate(day.getDate() - i);
      rhythm.push({
        date: day.toISOString(),
        studied: studiedDays.has(day.toISOString()),
      });
    }

    const daysStudied = rhythm.filter((d) => d.studied).length;

    const goalSummaries = await Promise.all(
      activeGoals.slice(0, 3).map(async (goal) => {
        const modules = await Module.find({ goalId: goal._id, userId }).sort({ order: 1 });
        const moduleSummaries = await Promise.all(
          modules.map(async (mod) => {
            const stats = await getModuleConceptStats(mod._id, userId);
            return {
              moduleId: mod._id,
              title: mod.title,
              touched: stats.touched,
              total: stats.total,
            };
          })
        );
        return {
          goalId: goal._id,
          title: goal.title,
          modules: moduleSummaries,
        };
      })
    );

    const enrichedResources = await Promise.all(
      recentResources.map(async (resource) => {
        const concept = await Concept.findOne({ _id: resource.conceptId, userId });
        const ctx = concept ? await enrichConcept(concept, userId) : null;
        return {
          ...resource.toObject(),
          conceptPath: ctx?.conceptPath,
          breadcrumb: ctx?.breadcrumb,
        };
      })
    );

    return res.status(200).json({
      greeting: getGreeting(),
      quote: pickQuote(userId),
      continue: continueItems,
      today: {
        concept: todayConcept,
        practice: todayPractice,
      },
      momentum: {
        sentence: `You studied ${daysStudied} of the last 7 days`,
        rhythm,
        goals: goalSummaries,
      },
      recentResources: enrichedResources,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const search = async (req, res) => {
  try {
    const userId = req.user.id;
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.status(200).json({ concepts: [], resources: [] });
    }

    const regex = new RegExp(q, "i");

    const [concepts, resources] = await Promise.all([
      Concept.find({ userId, title: regex }).limit(8),
      Resource.find({ userId, title: regex }).limit(8),
    ]);

    const enrichedConcepts = await enrichConcepts(concepts, userId);

    return res.status(200).json({
      concepts: enrichedConcepts,
      resources,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
