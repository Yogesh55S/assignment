import mongoose from "mongoose";
import { Kit } from "../../models/Kit.js";
import { FlashcardProgress, type IFlashcardProgress } from "../../models/FlashcardProgress.js";
import { NotFoundError, AppError } from "../../utils/errors.js";
import type {
  PracticeProgressResponse,
  PracticeProgressSummary,
  FlashcardProgressItem,
} from "@interview-prep/shared/types/editableKit";

export class PracticeService {
  /**
   * Records or updates a user's practice progress for a specific flashcard.
   */
  public static async saveFlashcardProgress(input: {
    userId: string;
    kitId: string;
    flashcardId: string;
    confidence: 1 | 2 | 3;
    covered?: boolean;
  }): Promise<IFlashcardProgress> {
    if (!mongoose.Types.ObjectId.isValid(input.kitId)) {
      throw new NotFoundError("Kit not found");
    }

    const kitDoc = await Kit.findOne({
      _id: input.kitId,
      userId: input.userId,
    });

    if (!kitDoc || !kitDoc.kit) {
      throw new NotFoundError("Kit not found or access denied");
    }

    // Verify flashcard exists in this kit
    const cardExists = kitDoc.kit.flashcards.some((f) => f.id === input.flashcardId);
    if (!cardExists) {
      throw new NotFoundError(`Flashcard '${input.flashcardId}' does not exist in this kit`);
    }

    const covered = input.covered !== undefined ? input.covered : true;

    const progressDoc = await FlashcardProgress.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(input.userId),
        kitId: new mongoose.Types.ObjectId(input.kitId),
        flashcardId: input.flashcardId,
      },
      {
        $set: {
          confidence: input.confidence,
          covered,
          lastSeenAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return progressDoc;
  }

  /**
   * Retrieves practice progress and completion summary for a kit.
   */
  public static async getKitPracticeProgress(input: {
    userId: string;
    kitId: string;
  }): Promise<PracticeProgressResponse> {
    if (!mongoose.Types.ObjectId.isValid(input.kitId)) {
      throw new NotFoundError("Kit not found");
    }

    const kitDoc = await Kit.findOne({
      _id: input.kitId,
      userId: input.userId,
    });

    if (!kitDoc || !kitDoc.kit) {
      throw new NotFoundError("Kit not found or access denied");
    }

    const progressDocs = await FlashcardProgress.find({
      userId: input.userId,
      kitId: input.kitId,
    }).sort({ lastSeenAt: -1 });

    const total = kitDoc.kit.flashcards.length;

    // Set of covered flashcard IDs that exist in current kit
    const validCardIdSet = new Set(kitDoc.kit.flashcards.map((f) => f.id));
    let coveredCount = 0;

    const progressItems: FlashcardProgressItem[] = [];

    for (const doc of progressDocs) {
      if (validCardIdSet.has(doc.flashcardId)) {
        if (doc.covered) {
          coveredCount++;
        }
        progressItems.push({
          flashcardId: doc.flashcardId,
          confidence: doc.confidence as 1 | 2 | 3,
          covered: doc.covered,
          lastSeenAt: doc.lastSeenAt.toISOString(),
        });
      }
    }

    const summary: PracticeProgressSummary = {
      total,
      covered: coveredCount,
      remaining: Math.max(0, total - coveredCount),
    };

    return {
      progress: progressItems,
      summary,
    };
  }
}
