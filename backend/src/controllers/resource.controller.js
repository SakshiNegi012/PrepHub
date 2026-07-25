import Resource from "../models/resource.model.js";
import Concept from "../models/concept.model.js";
import Goal from "../models/goal.model.js";
import Module from "../models/module.model.js";
import { getConceptContext } from "../services/concept.service.js";
import { logActivity } from "../utils/helpers.js";

async function resolveGoalId(conceptId, userId) {
  if (!conceptId) return null;
  const ctx = await getConceptContext(conceptId, userId);
  return ctx?.goal?._id;
}

export const createResource = async (req, res) => {
  const userId = req.user.id;
  const { conceptId, title, description, type, url, tags, favourite, goalId } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  try {
    if (conceptId) {
      const concept = await Concept.findOne({ _id: conceptId, userId });
      if (!concept) return res.status(404).json({ message: "Concept not found" });
    }

    const resolvedGoalId = goalId || (await resolveGoalId(conceptId, userId));

    const resource = await Resource.create({
      conceptId: conceptId || null,
      goalId: resolvedGoalId,
      title,
      description,
      type: type || "Other",
      url,
      tags: tags || [],
      favourite: favourite || false,
      userId,
    });

    let ctx = null;
    if (conceptId) {
      ctx = await getConceptContext(conceptId, userId);
      await logActivity(
        userId,
        "resource_added",
        `Added ${resource.type} resource to ${ctx?.concept?.title || "concept"}`,
        resource._id,
        "Resource"
      );
    }

    return res.status(201).json({ resource });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getResources = async (req, res) => {
  const userId = req.user.id;
  const { type, goalId, conceptId, q, favourite } = req.query;

  try {
    const filter = { userId };
    if (type) filter.type = type;
    if (goalId) filter.goalId = goalId;
    if (conceptId) filter.conceptId = conceptId;
    if (favourite === "true") filter.favourite = true;
    if (q) filter.title = new RegExp(q, "i");

    const resources = await Resource.find(filter).sort({ lastOpenedAt: -1, updatedAt: -1 });

    const enriched = await Promise.all(
      resources.map(async (resource) => {
        const ctx = await getConceptContext(resource.conceptId, userId);
        return {
          ...resource.toObject(),
          conceptPath: ctx?.conceptPath,
          breadcrumb: ctx?.breadcrumb,
        };
      })
    );

    return res.status(200).json({ resources: enriched });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getResourceById = async (req, res) => {
  const userId = req.user.id;

  try {
    const resource = await Resource.findOne({ _id: req.params.id, userId });
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    const ctx = await getConceptContext(resource.conceptId, userId);
    return res.status(200).json({
      resource: {
        ...resource.toObject(),
        conceptPath: ctx?.conceptPath,
        breadcrumb: ctx?.breadcrumb,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const openResource = async (req, res) => {
  const userId = req.user.id;

  try {
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, userId },
      { lastOpenedAt: new Date() },
      { new: true }
    );

    if (!resource) return res.status(404).json({ message: "Resource not found" });

    await Concept.findOneAndUpdate(
      { _id: resource.conceptId, userId },
      {
        lastStudiedAt: new Date(),
        lastOpenedResourceId: resource._id,
        status: "learning",
      }
    );

    const ctx = await getConceptContext(resource.conceptId, userId);
    await logActivity(
      userId,
      "resource_opened",
      `Opened "${resource.title}"`,
      resource._id,
      "Resource"
    );

    return res.status(200).json({
      resource: {
        ...resource.toObject(),
        conceptPath: ctx?.conceptPath,
        breadcrumb: ctx?.breadcrumb,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateResource = async (req, res) => {
  const userId = req.user.id;

  try {
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!resource) return res.status(404).json({ message: "Resource not found" });
    return res.status(200).json({ resource });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteResource = async (req, res) => {
  const userId = req.user.id;

  try {
    const resource = await Resource.findOneAndDelete({ _id: req.params.id, userId });
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    return res.status(200).json({ message: "Resource deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
