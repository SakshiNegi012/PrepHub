import mongoose from "mongoose";

const practiceItemSchema = new mongoose.Schema(
  {
    conceptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Concept",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["problem", "revision", "reading"],
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

const PracticeItem = mongoose.model("PracticeItem", practiceItemSchema);
export default PracticeItem;
