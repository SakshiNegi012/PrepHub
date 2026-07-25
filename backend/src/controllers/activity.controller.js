import Activity from "../models/activity.model.js";

export const getActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ activities });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
