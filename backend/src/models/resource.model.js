import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    conceptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Concept",
      default: null,
      index: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "video",
        "pdf",
        "doc",
        "link",
        "repo",
        "note",
        "Video",
        "PDF",
        "Article",
        "Website",
        "Github",
        "Notes",
        "Document",
        "Course",
        "Other",
      ],
      default: "Other",
    },
    url: {
      type: String,
      trim: true,
    },
    uploadedFile: {
      type: String,
    },
    personalNotes: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    favourite: {
      type: Boolean,
      default: false,
    },
    lastOpenedAt: {
      type: Date,
    },
    completed: {
      type: Boolean,
      default: false,
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

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
