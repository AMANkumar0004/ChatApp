import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { searchUsers, uploadProfilePic, removeProfilePic } from "../controllers/user.controller.js";
import { User } from "../models/User.js";
import { upload } from "../cloudinary.js";
import redis from "../config/redis.js";

const router = express.Router();

router.get("/search", protect, searchUsers);

router.get("/:userId/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("lastSeen");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ lastSeen: user.lastSeen });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/online
router.get("/online", protect, async (req, res) => {
  try {
    // HGETALL returns { userId: socketId, userId: socketId }
    const onlineUsers = await redis.hgetall('onlineUsers');
    
    // Just return the userIds who are online
    const onlineUserIds = onlineUsers ? Object.keys(onlineUsers) : [];
    
    res.json({ onlineUserIds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/upload-profile-pic", protect, upload.single("profilePic"), uploadProfilePic);
router.delete("/remove-profile-pic", protect, removeProfilePic);

export default router;