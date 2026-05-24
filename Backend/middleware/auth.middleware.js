import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import redis from "../config/redis.js"; // ✅ add this

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return res.status(401).json({ message: "No token" });

    // Step 1 — verify JWT signature is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 2 — find user in DB
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });

    // ✅ Step 3 — check if this token matches what's in Redis
    // If user logged in from another device, Redis has a different token
    const activeToken = await redis.get(`activeSession:${req.user._id}`);

    // ✅ Step 4 — token mismatch means they were kicked out
    if (activeToken && activeToken !== token) {
      return res.status(401).json({
        message: "You were logged in from another device.",
        kicked: true, // ← frontend can check this flag
      });
    }

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};