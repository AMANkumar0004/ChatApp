import express from "express";
import { signup, login, logout } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { httpRateLimit } from "../middleware/httpRateLimiter.js";
import redis from "../config/redis.js"; 
import { User } from "../models/User.js"; 

const router = express.Router();



router.post("/check-availability", async (req, res) => {
  try {
    const { field, value } = req.body;

    if (!field || !value) {
      return res.json({ available: true });
    }

    const filterMap = {
      email: 'bf:emails',
      username: 'bf:usernames',
      phone: 'bf:phones',
    };

    const filter = filterMap[field];
    if (!filter) return res.json({ available: true });

    //  ioredis correct syntax
    let mayExist = false;
    try {
      const result = await redis.sendCommand(['BF.EXISTS', filter, value]);
      mayExist = result === 1;
    } catch (err) {
      console.error("BF.EXISTS error:", err.message);
      mayExist = true; // fail safe
    }

    if (!mayExist) {
      return res.json({ available: true });
    }

    const query = { [field]: value };
    const existing = await User.findOne(query).select('_id');
    return res.json({ available: !existing });

  } catch (err) {
    console.error("check-availability error:", err.message);
    res.status(500).json({ available: true });
  }
});

router.post("/login", httpRateLimit(5, 15 * 60, "login"), login);  
router.post("/signup", httpRateLimit(10, 60 * 60, "signup"), signup);

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});
router.get("/test-ip", (req, res) => {
  res.json({
    ip: req.ip,
    forwarded: req.headers['x-forwarded-for'],
    realIp: req.headers['x-real-ip'],
  });
});

router.post("/logout", protect, logout);

export default router;