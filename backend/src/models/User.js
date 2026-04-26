import mongoose from "mongoose";

const schoolSessionSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      trim: true,
      default: "",
    },
    end: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const studyGoalSubjectSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    currentScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    targetScore: {
      type: Number,
      default: 10,
      min: 0,
      max: 10,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    classroom: {
      type: String,
      trim: true,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: null,
      index: true,
    },
    userCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: /^\d{8}$/,
      minlength: 8,
      maxlength: 8,
    },
    avatarUrl: {
      type: String, // link CDN để hiển thị hình
    },
    avatarId: {
      type: String, // Cloudinary public_id để xoá hình
    },
    bio: {
      type: String,
      maxlength: 500, // tuỳ
    },
    phone: {
      type: String,
      sparse: true, // cho phép null, nhưng không được trùng
    },
    schoolSchedule: {
      morning: {
        type: schoolSessionSchema,
        default: () => ({}),
      },
      afternoon: {
        type: schoolSessionSchema,
        default: () => ({}),
      },
      hasCompletedSetup: {
        type: Boolean,
        default: false,
      },
      completedAt: {
        type: Date,
        default: null,
      },
    },
    studyGoals: {
      selectedSubjects: {
        type: [String],
        default: [],
      },
      subjects: {
        type: [studyGoalSubjectSchema],
        default: [],
      },
    },
    preferences: {
      rememberLogin: {
        type: Boolean,
        default: false,
      },
      lastLoginUsername: {
        type: String,
        trim: true,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
