import mongoose from "mongoose";
import { Kit, type IKit } from "../../models/Kit.js";
import type { InterviewPrepKit } from "@interview-prep/shared/types/kit";
import type { EditableInterviewPrepKit } from "@interview-prep/shared/types/editableKit";
import { validateInterviewPrepKit } from "@interview-prep/shared/validators/kitSchema";
import { validateEditableInterviewPrepKit } from "@interview-prep/shared/validators/editableKitSchema";
import { AppError, NotFoundError } from "../../utils/errors.js";

export class KitService {
  /**
   * Retrieves all kits owned by a specific authenticated user, newest first.
   */
  public static async getUserKits(userId: string): Promise<IKit[]> {
    return Kit.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves an individual kit by ID, ensuring user ownership.
   */
  public static async findKitById(userId: string, kitId: string): Promise<IKit | null> {
    if (!mongoose.Types.ObjectId.isValid(kitId)) {
      return null;
    }
    return Kit.findOne({ _id: kitId, userId });
  }

  /**
   * Finds a previously generated 'ready' kit matching user and request fingerprint.
   */
  public static async findReusableKit(input: {
    userId: string;
    requestFingerprint: string;
  }): Promise<IKit | null> {
    return Kit.findOne({
      userId: input.userId,
      requestFingerprint: input.requestFingerprint,
      generationStatus: "ready",
      kit: { $ne: null },
    }).sort({ createdAt: -1 });
  }

  /**
   * Finds an actively 'generating' kit matching user and request fingerprint.
   */
  public static async findGeneratingKit(input: {
    userId: string;
    requestFingerprint: string;
  }): Promise<IKit | null> {
    return Kit.findOne({
      userId: input.userId,
      requestFingerprint: input.requestFingerprint,
      generationStatus: "generating",
    });
  }

  /**
   * Creates a new kit record in 'generating' state.
   */
  public static async createGeneratingKit(input: {
    userId: string;
    requestFingerprint: string;
  }): Promise<IKit> {
    try {
      const doc = new Kit({
        userId: new mongoose.Types.ObjectId(input.userId),
        requestFingerprint: input.requestFingerprint,
        generationStatus: "generating",
        kit: null,
      });
      return await doc.save();
    } catch (err: unknown) {
      // Handle race condition with duplicate key if any
      const existing = await Kit.findOne({
        userId: input.userId,
        requestFingerprint: input.requestFingerprint,
      });
      if (existing) {
        return existing;
      }
      throw err;
    }
  }

  /**
   * Marks a generating kit as 'ready' with validated InterviewPrepKit payload.
   */
  public static async markKitReady(input: {
    kitId: string;
    userId: string;
    kit: InterviewPrepKit;
    warnings?: Array<{ code: string; message: string }>;
  }): Promise<IKit> {
    // Validate schema strictly before persisting
    const validated = validateInterviewPrepKit(input.kit);

    const doc = await Kit.findOneAndUpdate(
      { _id: input.kitId, userId: input.userId },
      {
        $set: {
          kit: validated,
          generationStatus: "ready",
          generationError: undefined,
          warnings: input.warnings || [],
        },
      },
      { new: true }
    );

    if (!doc) {
      throw new NotFoundError("Kit not found or ownership mismatch");
    }

    return doc;
  }

  /**
   * Marks a generating kit as 'failed' with structured safe error message.
   */
  public static async markKitFailed(input: {
    kitId: string;
    userId: string;
    error: { code: string; message: string };
  }): Promise<IKit> {
    const doc = await Kit.findOneAndUpdate(
      { _id: input.kitId, userId: input.userId },
      {
        $set: {
          generationStatus: "failed",
          generationError: {
            code: input.error.code,
            message: input.error.message.slice(0, 500),
          },
        },
      },
      { new: true }
    );

    if (!doc) {
      throw new NotFoundError("Kit not found or ownership mismatch");
    }

    return doc;
  }

  /**
   * Updates an editable kit draft with optimistic concurrency check and referential validation.
   */
  public static async updateKitDraft(input: {
    userId: string;
    kitId: string;
    kit: EditableInterviewPrepKit;
    clientUpdatedAt?: string;
  }): Promise<IKit> {
    if (!mongoose.Types.ObjectId.isValid(input.kitId)) {
      throw new NotFoundError("Kit not found");
    }

    const existingDoc = await Kit.findOne({
      _id: input.kitId,
      userId: input.userId,
    });

    if (!existingDoc) {
      throw new NotFoundError("Kit not found or ownership mismatch");
    }

    // Optimistic concurrency check
    if (input.clientUpdatedAt) {
      const clientTime = new Date(input.clientUpdatedAt).getTime();
      const serverTime = existingDoc.updatedAt.getTime();
      // If server timestamp is newer than client timestamp by more than 1000ms
      if (!isNaN(clientTime) && serverTime - clientTime > 1000) {
        throw new AppError(
          409,
          "KIT_CONFLICT",
          "This kit changed elsewhere. Refresh and try again."
        );
      }
    }

    // Preserve immutable source provenance
    if (existingDoc.kit?.source) {
      input.kit.source.company_url = existingDoc.kit.source.company_url;
      input.kit.source.jd_chars = existingDoc.kit.source.jd_chars;
    }

    // Validate complete editable kit structure & referential integrity
    const validatedKit = validateEditableInterviewPrepKit(input.kit);

    existingDoc.kit = validatedKit as unknown as InterviewPrepKit;
    existingDoc.generationStatus = "ready";
    existingDoc.generationError = undefined;

    return await existingDoc.save();
  }

  /**
   * Deletes an owned kit and its associated flashcard progress records.
   */
  public static async deleteKitById(input: {
    userId: string;
    kitId: string;
  }): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(input.kitId)) {
      throw new NotFoundError("Kit not found");
    }

    const result = await Kit.deleteOne({
      _id: input.kitId,
      userId: input.userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError("Kit not found or ownership mismatch");
    }

    // Clean up flashcard progress
    const { FlashcardProgress } = await import("../../models/FlashcardProgress.js");
    await FlashcardProgress.deleteMany({
      userId: input.userId,
      kitId: input.kitId,
    });
  }
}

