import jwt from "jsonwebtoken";
import config from "../config/config.js";

export function protect(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = { id: decoded.id, sessionId: decoded.sessionId };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
