import express from "express";
import {
  getLeaderboard,
  getResultsOverview,
  getTodayProgress,
  submitPracticeAttempt,
} from "../controllers/rankingController.js";

const router = express.Router();

router.get("/", getLeaderboard);
router.get("/results", getResultsOverview);
router.get("/today-progress", getTodayProgress);
router.post("/attempts", submitPracticeAttempt);

export default router;
