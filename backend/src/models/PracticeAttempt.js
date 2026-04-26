import mongoose from "mongoose";

const practiceAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    examId: {
      type: String,
      required: true,
      trim: true,
    },
    examTitle: {
      type: String,
      trim: true,
      default: "",
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    wrongCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    timeSpentSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    submissionHistory: {
      type: [Date],
      default: [],
    },
    suspiciousExitCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    autoSubmittedForCheating: {
      type: Boolean,
      default: false,
    },
    flaggedForReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    antiCheatEvents: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

practiceAttemptSchema.index({ userId: 1, examId: 1 }, { unique: true });

const PracticeAttempt = mongoose.model("PracticeAttempt", practiceAttemptSchema);

export default PracticeAttempt;
