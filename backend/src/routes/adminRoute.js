import express from "express";
import { getAdminAnalytics, getAdminOverview } from "../controllers/adminController.js";
import { createAdminExam } from "../controllers/examController.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  createNotification,
  listAdminNotifications,
  searchUsersForNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/overview", authorizeRoles("admin"), getAdminOverview);
router.get("/analytics", authorizeRoles("admin"), getAdminAnalytics);
router.post("/exams", authorizeRoles("admin"), createAdminExam);
router.get("/users/search", authorizeRoles("admin"), searchUsersForNotification);
router.get("/notifications", authorizeRoles("admin"), listAdminNotifications);
router.post("/notifications", authorizeRoles("admin"), createNotification);

export default router;
