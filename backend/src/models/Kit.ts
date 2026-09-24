import mongoose, { Schema, Document, Model } from "mongoose";
import type { InterviewPrepKit } from "@interview-prep/shared/types/kit";

export type GenerationStatus = "draft" | "generating" | "ready" | "failed";

export interface IGenerationError {
  code: string;
  message: string;
}

export interface ISourceMetadata {
  company_url: string;
  days: number;
  jd_chars: number;
  jd?: string;
}

export interface IKit extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  kit: InterviewPrepKit | null;
  generationStatus: GenerationStatus;
  generationError?: IGenerationError;
  warnings?: Array<{ code: string; message: string }>;
  requestFingerprint: string;
  sourceMetadata?: ISourceMetadata;
  researchSnapshot?: Record<string, unknown> | null;
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

const SourceMetadataSchema = new Schema<ISourceMetadata>(
  {
    company_url: { type: String, required: true },
    days: { type: Number, required: true },
    jd_chars: { type: Number, required: true },
    jd: { type: String, required: false },
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
    sourceMetadata: {
      type: SourceMetadataSchema,
      required: false,
    },
    researchSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
      required: false,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Indexes
KitSchema.index({ userId: 1, updatedAt: -1 });
KitSchema.index({ userId: 1, createdAt: -1 });
KitSchema.index({ userId: 1, requestFingerprint: 1 });

export const Kit: Model<IKit> = mongoose.models.Kit || mongoose.model<IKit>("Kit", KitSchema);
