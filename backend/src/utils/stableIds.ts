import type {
  Requirement,
  InterviewQuestion,
  Flashcard,
  QuestionCategory,
  RequirementKind,
  RequirementPriority,
} from "@interview-prep/shared/types/kit";

export function assignRequirementIds(
  requirements: Array<{
    text: string;
    kind: RequirementKind;
    priority: RequirementPriority;
  }>
): Requirement[] {
  const result: Requirement[] = [];
  const seenTexts = new Set<string>();

  let idCounter = 1;
  for (const req of requirements) {
    const trimmedText = req.text.trim();
    if (!trimmedText) continue;

    const normalizedKey = `${req.kind}:${req.priority}:${trimmedText.toLowerCase()}`;
    if (seenTexts.has(normalizedKey)) {
      continue;
    }
    seenTexts.add(normalizedKey);

    result.push({
      id: `r${idCounter++}`,
      text: trimmedText,
      kind: req.kind,
      priority: req.priority,
    });
  }

  return result;
}

export function assignQuestionIds(
  questions: Array<{
    requirement_ids: string[];
    category: QuestionCategory;
    prompt: string;
    answer_outline: string;
    difficulty: 1 | 2 | 3;
  }>,
  startAt = 1
): InterviewQuestion[] {
  const result: InterviewQuestion[] = [];
  let idCounter = Math.max(1, startAt);

  for (const q of questions) {
    // Deduplicate requirement_ids preserving order
    const dedupedReqIds: string[] = [];
    const seenReqs = new Set<string>();
    for (const rId of q.requirement_ids) {
      const trimmed = rId.trim();
      if (trimmed && !seenReqs.has(trimmed)) {
        seenReqs.add(trimmed);
        dedupedReqIds.push(trimmed);
      }
    }

    result.push({
      id: `q${idCounter++}`,
      requirement_ids: dedupedReqIds,
      category: q.category,
      prompt: q.prompt.trim(),
      answer_outline: q.answer_outline.trim(),
      difficulty: q.difficulty,
    });
  }

  return result;
}

export function assignFlashcardIds(
  flashcards: Array<{
    front: string;
    back: string;
    requirement_ids: string[];
  }>,
  startAt = 1
): Flashcard[] {
  const result: Flashcard[] = [];
  let idCounter = Math.max(1, startAt);

  for (const fc of flashcards) {
    const dedupedReqIds: string[] = [];
    const seenReqs = new Set<string>();
    for (const rId of fc.requirement_ids) {
      const trimmed = rId.trim();
      if (trimmed && !seenReqs.has(trimmed)) {
        seenReqs.add(trimmed);
        dedupedReqIds.push(trimmed);
      }
    }

    result.push({
      id: `f${idCounter++}`,
      front: fc.front.trim(),
      back: fc.back.trim(),
      requirement_ids: dedupedReqIds,
    });
  }

  return result;
}
