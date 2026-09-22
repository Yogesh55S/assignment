import mongoose, { Schema, Document, Model } from "mongoose";
import type { InterviewPrepKit } from "@interview-prep/shared/types/kit";

export type GenerationStatus = "draft" | "generating" | "ready" | "failed";

export interface IGenerationError {
  code: string;
  message: string;
}

export interface IKit extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  kit: InterviewPrepKit | null;
  generationStatus: GenerationStatus;
  generationError?: IGenerationError;
  warnings?: Array<{ code: string; message: string }>;
  requestFingerprint: string;
  createdAt: Date;
  updatedAt: Date;
}

const GenerationErrorSchema = new Schema<IGenerationError>(
  {
    code: { type: String, required: true },
    message: { type: String, required: true },
  },
  { _id: false }
);

const KitSchema = new Schema<IKit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Flexible nested document matching the full InterviewPrepKit structure
    kit: {
      type: Schema.Types.Mixed,
      default: null,
    },
    generationStatus: {
      type: String,
      enum: ["draft", "generating", "ready", "failed"],
      default: "draft",
      required: true,
    },
    generationError: {
      type: GenerationErrorSchema,
      required: false,
    },
    warnings: {
      type: [
        new Schema(
          {
            code: { type: String, required: true },
            message: { type: String, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    requestFingerprint: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
KitSchema.index({ userId: 1, createdAt: -1 });
KitSchema.index({ userId: 1, requestFingerprint: 1 });

export const Kit: Model<IKit> = mongoose.models.Kit || mongoose.model<IKit>("Kit", KitSchema);
