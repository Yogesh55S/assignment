import type { Request, Response } from "express";
import { KitService } from "../services/persistence/kitService.js";
import { createKitInputSchema } from "@interview-prep/shared/validators/kitSchema";
import { generateInterviewPrepKit } from "../services/generation/kitPipeline.js";
import { createRequestFingerprint } from "../utils/requestFingerprint.js";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";

export class KitController {
  /**
   * GET /api/kits
   * Returns list of kits owned by authenticated user.
   */
  public static async getKits(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const kits = await KitService.getUserKits(req.user.id);
    res.status(200).json({ kits });
  }

  /**
   * GET /api/kits/:id
   * Retrieves specific kit owned by authenticated user.
   */
  public static async getKitById(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const kit = await KitService.findKitById(req.user.id, req.params.id);
    if (!kit) {
      throw new NotFoundError("Kit not found");
    }

    res.status(200).json({ kit });
  }

  /**
   * GET /api/kits/:id/status
   * Retrieves kit generation status, error, and timestamps.
   */
  public static async getKitStatus(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const kit = await KitService.findKitById(req.user.id, req.params.id);
    if (!kit) {
      throw new NotFoundError("Kit not found");
    }

    res.status(200).json({
      id: kit._id,
      status: kit.generationStatus,
      error: kit.generationError || null,
      createdAt: kit.createdAt,
      updatedAt: kit.updatedAt,
    });
  }

  /**
   * POST /api/kits
   * Generates a new interview prep kit or returns deduplicated ready/generating kit.
   */
  public static async createKit(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const parsedInput = createKitInputSchema.parse(req.body);
    const userId = req.user.id;

    const requestFingerprint = createRequestFingerprint({
      userId,
      jd: parsedInput.jd,
      companyUrl: parsedInput.company_url,
      days: parsedInput.days,
    });

    const sourceMetadata = {
      company_url: parsedInput.company_url,
      days: parsedInput.days,
      jd_chars: parsedInput.jd.length,
      jd: parsedInput.jd,
    };

    // 1. Check if a ready kit already exists for this exact request
    const reusableKit = await KitService.findReusableKit({
      userId,
      requestFingerprint,
    });

    if (reusableKit) {
      res.status(200).json({
        kit: reusableKit,
        reused: true,
      });
      return;
    }

    // 2. Check if a kit is already currently generating
    const generatingKit = await KitService.findGeneratingKit({
      userId,
      requestFingerprint,
    });

    if (generatingKit) {
      res.status(202).json({
        kitId: generatingKit._id,
        status: "generating",
        message: "A kit for this posting is already being generated.",
      });
      return;
    }

    // 3. Check if a failed kit exists for this fingerprint — reuse it instead of creating duplicate records
    const failedKit = await KitService.findFailedKitByFingerprint({
      userId,
      requestFingerprint,
    });

    let kitRecord;
    if (failedKit) {
      kitRecord = await KitService.resetFailedKitToGenerating({
        kitId: failedKit._id.toString(),
        userId,
        sourceMetadata,
      });
    } else {
      kitRecord = await KitService.createGeneratingKit({
        userId,
        requestFingerprint,
        sourceMetadata,
      });
    }

    try {
      // Execute multi-step kit generation pipeline
      const generationResult = await generateInterviewPrepKit(
        {
          jd: parsedInput.jd,
          companyUrl: parsedInput.company_url,
          days: parsedInput.days,
        },
        {
          userId,
        }
      );

      // Save validated kit and mark ready
      const readyDoc = await KitService.markKitReady({
        kitId: kitRecord._id.toString(),
        userId,
        kit: generationResult.kit,
        warnings: generationResult.researchWarnings,
      });

      res.status(201).json({
        kit: readyDoc,
        reused: false,
        warnings: generationResult.researchWarnings,
      });
    } catch (err: unknown) {
      // If kit generation failed, remove the pending placeholder record from MongoDB
      // so failed or duplicate kit documents are not persisted in the database.
      await KitService.deleteKitById({
        userId,
        kitId: kitRecord._id.toString(),
      }).catch(() => {});

      throw err;
    }
  }

  /**
   * POST /api/kits/:id/retry
   * Retries kit generation for an existing failed kit document.
   */
  public static async retryKit(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const userId = req.user.id;
    const kitId = req.params.id;

    const existingDoc = await KitService.findKitById(userId, kitId);
    if (!existingDoc) {
      throw new NotFoundError("Kit not found or access denied");
    }

    if (existingDoc.generationStatus !== "failed") {
      throw new AppError(
        400,
        "INVALID_RETRY",
        "Only failed kits can be retried."
      );
    }

    const sourceMeta = existingDoc.sourceMetadata;
    if (!sourceMeta || !sourceMeta.jd || !sourceMeta.company_url || !sourceMeta.days) {
      throw new AppError(
        400,
        "INVALID_RETRY_DATA",
        "Original job description metadata is missing for retry."
      );
    }

    // Reset status to generating
    await KitService.resetFailedKitToGenerating({
      kitId,
      userId,
    });

    try {
      const generationResult = await generateInterviewPrepKit(
        {
          jd: sourceMeta.jd,
          companyUrl: sourceMeta.company_url,
          days: sourceMeta.days,
        },
        {
          userId,
        }
      );

      const readyDoc = await KitService.markKitReady({
        kitId,
        userId,
        kit: generationResult.kit,
        warnings: generationResult.researchWarnings,
      });

      res.status(200).json({
        kit: readyDoc,
        reused: false,
        warnings: generationResult.researchWarnings,
      });
    } catch (err: unknown) {
      const errorCode = err instanceof AppError ? err.code : "GENERATION_FAILED";
      const errorMessage = err instanceof Error ? err.message : "Kit generation encountered an error.";

      await KitService.markKitFailed({
        kitId,
        userId,
        error: { code: errorCode, message: errorMessage },
      });

      throw err;
    }
  }

  /**
   * PATCH /api/kits/:id
   * Updates an editable kit draft with optimistic concurrency control.
   */
  public static async updateKit(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { kitUpdatePayloadSchema } = await import(
      "@interview-prep/shared/validators/editableKitSchema"
    );
    const parsedPayload = kitUpdatePayloadSchema.parse(req.body);

    const updatedDoc = await KitService.updateKitDraft({
      userId: req.user.id,
      kitId: req.params.id,
      kit: parsedPayload.kit,
      clientUpdatedAt: parsedPayload.clientUpdatedAt,
    });

    res.status(200).json({ kit: updatedDoc });
  }

  /**
   * DELETE /api/kits/:id
   * Deletes an owned kit and its practice progress.
   */
  public static async deleteKit(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    await KitService.deleteKitById({
      userId: req.user.id,
      kitId: req.params.id,
    });

    res.status(204).send();
  }

  /**
   * POST /api/kits/:id/regenerate
   * Selectively regenerates a section (company_brief, question category, or schedule).
   */
  public static async regenerateSection(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { regenerateSectionSchema } = await import(
      "@interview-prep/shared/validators/editableKitSchema"
    );
    const { regenerateKitSection } = await import(
      "../services/generation/regenerationService.js"
    );

    const parsed = regenerateSectionSchema.parse(req.body);
    const userId = req.user.id;
    const kitId = req.params.id;

    const existingDoc = await KitService.findKitById(userId, kitId);
    if (!existingDoc || !existingDoc.kit) {
      throw new NotFoundError("Kit not found or access denied");
    }

    if (existingDoc.generationStatus !== "ready") {
      throw new AppError(
        400,
        "KIT_NOT_READY",
        "Sections can only be regenerated for kits in ready state."
      );
    }

    // Optimistic concurrency check
    if (parsed.clientUpdatedAt) {
      const clientTime = new Date(parsed.clientUpdatedAt).getTime();
      const serverTime = existingDoc.updatedAt.getTime();
      if (!isNaN(clientTime) && serverTime - clientTime > 1000) {
        throw new AppError(
          409,
          "KIT_CONFLICT",
          "This kit changed elsewhere. Refresh and try again."
        );
      }
    }

    const regenResult = await regenerateKitSection({
      kit: existingDoc.kit as any,
      section: parsed.section,
      category: parsed.category,
      replaceEdited: parsed.replaceEdited,
    });

    // Persist regenerated kit draft
    const updatedDoc = await KitService.updateKitDraft({
      userId,
      kitId,
      kit: regenResult.kit,
    });

    res.status(200).json({
      kit: updatedDoc,
      preservedEditedContent: regenResult.preservedEditedContent,
      regeneratedCount: regenResult.regeneratedCount,
      preservedCount: regenResult.preservedCount,
      warnings: regenResult.warnings,
    });
  }

  /**
   * POST /api/kits/:id/practice
   * Submits flashcard active recall confidence rating.
   */
  public static async savePractice(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { practiceSubmissionSchema } = await import(
      "@interview-prep/shared/validators/editableKitSchema"
    );
    const { PracticeService } = await import(
      "../services/persistence/practiceService.js"
    );

    const parsed = practiceSubmissionSchema.parse(req.body);

    const progressDoc = await PracticeService.saveFlashcardProgress({
      userId: req.user.id,
      kitId: req.params.id,
      flashcardId: parsed.flashcardId,
      confidence: parsed.confidence,
      covered: parsed.covered,
    });

    res.status(200).json({ progress: progressDoc });
  }

  /**
   * GET /api/kits/:id/practice
   * Retrieves practice progress records and completion summary.
   */
  public static async getPractice(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { PracticeService } = await import(
      "../services/persistence/practiceService.js"
    );

    const result = await PracticeService.getKitPracticeProgress({
      userId: req.user.id,
      kitId: req.params.id,
    });

    res.status(200).json(result);
  }
}
