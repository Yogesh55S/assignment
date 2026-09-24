import mongoose from "mongoose";
import { Kit } from "../models/Kit.js";

/**
 * Migration script for Kit documents.
 * Ensures additive compatibility:
 * - Backfills missing generationStatus default ('ready' if kit is present, 'failed' if generationError is present)
 * - Ensures researchSnapshot defaults to null if absent
 * - Ensures warnings defaults to empty array if absent
 *
 * Usage:
 *   npx tsx src/scripts/migrateKitDocuments.ts          (Dry-run, logs counts only)
 *   npx tsx src/scripts/migrateKitDocuments.ts --apply  (Writes changes to MongoDB)
 */
export async function runKitMigration(options: { apply: boolean }): Promise<{
  scannedCount: number;
  migratedCount: number;
  alreadyCompliantCount: number;
}> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is required to run migration");
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const cursor = Kit.find({}).cursor();
  let scannedCount = 0;
  let migratedCount = 0;
  let alreadyCompliantCount = 0;

  for await (const doc of cursor) {
    scannedCount++;
    let needsUpdate = false;

    if (!doc.generationStatus) {
      doc.generationStatus = doc.kit ? "ready" : doc.generationError ? "failed" : "draft";
      needsUpdate = true;
    }

    if (doc.warnings === undefined) {
      doc.warnings = [];
      needsUpdate = true;
    }

    if (doc.researchSnapshot === undefined) {
      doc.researchSnapshot = null;
      needsUpdate = true;
    }

    if (needsUpdate) {
      migratedCount++;
      if (options.apply) {
        await doc.save();
      }
    } else {
      alreadyCompliantCount++;
    }
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  return { scannedCount, migratedCount, alreadyCompliantCount };
}

if (process.argv[1]?.endsWith("migrateKitDocuments.ts") || process.argv[1]?.endsWith("migrateKitDocuments.js")) {
  const isApply = process.argv.includes("--apply");
  console.log(`Starting Kit documents migration [mode: ${isApply ? "APPLY (writing changes)" : "DRY-RUN (read-only inspection)"}]...`);
  runKitMigration({ apply: isApply })
    .then((stats) => {
      console.log(`Migration Completed:`);
      console.log(`  Scanned Documents: ${stats.scannedCount}`);
      console.log(`  Needs Migration:   ${stats.migratedCount}`);
      console.log(`  Already Compliant: ${stats.alreadyCompliantCount}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`Migration Failed safely: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    });
}
