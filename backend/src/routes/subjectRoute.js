import express from "express";
import { createSubject, getSubjects } from "../controllers/subjectController.js";

const router = express.Router();

router.get("/", getSubjects);
router.post("/", createSubject);

export default router;
