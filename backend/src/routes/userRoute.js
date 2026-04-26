import express from "express";
import {
  authMe,
  completeOnboarding,
  searchUserByUsername,
  updateProfile,
  updateStudyGoals,
  updateSchoolSchedule,
  uploadAvatar,
} from "../controllers/userController.js";
import { getMyNotifications } from "../controllers/notificationController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/notifications", getMyNotifications);
router.get("/search", searchUserByUsername);
router.patch("/profile", updateProfile);
router.patch("/onboarding", completeOnboarding);
router.patch("/study-goals", updateStudyGoals);
router.patch("/school-schedule", updateSchoolSchedule);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

export default router;
