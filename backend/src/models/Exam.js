import mongoose from "mongoose";

const examQuestionSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      min: 1,
    },
    topicLabel: {
      type: String,
      trim: true,
      default: "",
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    hint: {
      type: String,
      trim: true,
      default: "",
    },
    options: {
      type: [String],
      default: [],
    },
    correctIndex: {
      type: Number,
      min: 0,
      default: 0,
    },
    explanationTitle: {
      type: String,
      trim: true,
      default: "",
    },
    explanationSteps: {
      type: [String],
      default: [],
    },
    explanationConclusion: {
      type: String,
      trim: true,
      default: "",
    },
    formula: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const essayContentSchema = new mongoose.Schema(
  {
    readingPassage: {
      type: String,
      trim: true,
      default: "",
    },
    readingQuestion: {
      type: String,
      trim: true,
      default: "",
    },
    essayPrompt: {
      type: String,
      trim: true,
      default: "",
    },
    checklist: {
      type: [String],
      default: [],
    },
    statusNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    examId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subjectSlug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    examType: {
      type: String,
      enum: ["multiple_choice", "essay"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1,
    },
    difficulty: {
      type: String,
      enum: ["Trung bình", "Khó", "Rất khó"],
      required: true,
    },
    category: {
      type: String,
      enum: ["illustration", "specialized", "self-study"],
      required: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    badge: {
      type: String,
      trim: true,
      default: "",
    },
    questions: {
      type: [examQuestionSchema],
      default: [],
    },
    essayContent: {
      type: essayContentSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model("Exam", examSchema);

export default Exam;
