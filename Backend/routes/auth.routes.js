import express from "express";
import { signup, login, logout } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { httpRateLimit } from "../middleware/httpRateLimiter.js";

const router = express.Router();


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