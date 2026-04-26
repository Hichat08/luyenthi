import express from "express";
import { getExamDetail, getExams } from "../controllers/examController.js";

const router = express.Router();

router.get("/", getExams);
router.get("/:examId", getExamDetail);

export default router;
