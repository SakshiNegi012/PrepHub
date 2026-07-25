import Activity from "../models/activity.model.js";

export async function logActivity(userId, actionType, message, referenceId, referenceType) {
  await Activity.create({
    userId,
    actionType,
    message,
    referenceId,
    referenceType,
  });
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n) {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}
