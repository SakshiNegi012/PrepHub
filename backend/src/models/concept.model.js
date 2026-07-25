import mongoose from "mongoose";

const conceptSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["not_started", "learning", "needs_revision", "comfortable"],
      default: "not_started",
    },
    lastStudiedAt: {
      type: Date,
    },
    lastOpenedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
    },
    revisionDueAt: {
      type: Date,
    },
    personalNotes: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Concept = mongoose.model("Concept", conceptSchema);
export default Concept;
