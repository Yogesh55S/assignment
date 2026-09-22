import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFlashcardProgress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  kitId: mongoose.Types.ObjectId;
  flashcardId: string;
  confidence: 1 | 2 | 3;
  covered: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardProgressSchema = new Schema<IFlashcardProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    kitId: {
      type: Schema.Types.ObjectId,
      ref: "Kit",
      required: true,
    },
    flashcardId: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
      required: true,
    },
    covered: {
      type: Boolean,
      default: false,
      required: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: userId + kitId + flashcardId
FlashcardProgressSchema.index({ userId: 1, kitId: 1, flashcardId: 1 }, { unique: true });

export const FlashcardProgress: Model<IFlashcardProgress> =
  mongoose.models.FlashcardProgress ||
  mongoose.model<IFlashcardProgress>("FlashcardProgress", FlashcardProgressSchema);
