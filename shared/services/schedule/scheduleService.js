import { MIN_SCHEDULE_DAYS, MAX_SCHEDULE_DAYS, DEFAULT_MINUTES_BY_DIFFICULTY, DEFAULT_EMPTY_DAY_MINUTES, PRIORITY_WEIGHT_MUST, PRIORITY_WEIGHT_NICE, PRIORITY_WEIGHT_NONE, DIFFICULTY_WEIGHT_MAP, FOCUS_MUST_HAVE, FOCUS_NICE_HAVE, FOCUS_REVIEW, } from "../../constants/index.js";
/**
 * Calculates deterministic scheduling scores for questions based on requirement priorities and difficulty.
 * Deduplicates questions by question.id (preserving the first occurrence).
 */
export function calculateQuestionSchedulingScores(requirements, questions) {
    // Map requirement ID to its priority for fast lookup
    const reqMap = new Map();
    for (const req of requirements) {
        if (!reqMap.has(req.id)) {
            reqMap.set(req.id, req.priority);
        }
    }
    // Deduplicate questions by ID while preserving original input order
    const uniqueQuestions = [];
    const seenQuestionIds = new Set();
    for (const q of questions) {
        if (!q || typeof q.id !== "string")
            continue;
        if (seenQuestionIds.has(q.id))
            continue;
        seenQuestionIds.add(q.id);
        uniqueQuestions.push(q);
    }
    const scores = [];
    for (const q of uniqueQuestions) {
        // Collect valid linked requirement IDs preserving order in question.requirement_ids
        const linkedRequirementIds = [];
        const seenReqs = new Set();
        let hasMust = false;
        let hasNice = false;
        if (Array.isArray(q.requirement_ids)) {
            for (const rId of q.requirement_ids) {
                if (seenReqs.has(rId))
                    continue;
                seenReqs.add(rId);
                const priority = reqMap.get(rId);
                if (priority !== undefined) {
                    linkedRequirementIds.push(rId);
                    if (priority === "must") {
                        hasMust = true;
                    }
                    else if (priority === "nice") {
                        hasNice = true;
                    }
                }
            }
        }
        // Determine priority weight
        let priorityWeight = PRIORITY_WEIGHT_NONE;
        if (hasMust) {
            priorityWeight = PRIORITY_WEIGHT_MUST;
        }
        else if (hasNice) {
            priorityWeight = PRIORITY_WEIGHT_NICE;
        }
        // Determine difficulty weight
        const difficulty = q.difficulty;
        const difficultyWeight = DIFFICULTY_WEIGHT_MAP[difficulty] ?? 10;
        const score = priorityWeight + difficultyWeight;
        scores.push({
            questionId: q.id,
            score,
            priorityWeight,
            difficultyWeight,
            linkedRequirementIds,
            hasMustRequirement: hasMust,
            highestDifficulty: difficulty,
        });
    }
    return scores;
}
/**
 * Deterministically allocates questions across preparation days using a round-robin priority algorithm.
 * Guarantees exactly daysAvailable days, integer minutes, and consistent ordering.
 */
export function allocateStudySchedule(input) {
    const { daysAvailable, requirements, questions, options } = input;
    // 1. Validate daysAvailable
    if (!Number.isInteger(daysAvailable) ||
        daysAvailable < MIN_SCHEDULE_DAYS ||
        daysAvailable > MAX_SCHEDULE_DAYS) {
        throw new Error(`Invalid daysAvailable: ${daysAvailable}. Must be an integer between ${MIN_SCHEDULE_DAYS} and ${MAX_SCHEDULE_DAYS}.`);
    }
    // 2. Validate options
    const minutesConfig = {
        1: options?.minutesByDifficulty?.[1] ?? DEFAULT_MINUTES_BY_DIFFICULTY[1],
        2: options?.minutesByDifficulty?.[2] ?? DEFAULT_MINUTES_BY_DIFFICULTY[2],
        3: options?.minutesByDifficulty?.[3] ?? DEFAULT_MINUTES_BY_DIFFICULTY[3],
    };
    for (const diff of [1, 2, 3]) {
        const mins = minutesConfig[diff];
        if (!Number.isInteger(mins) || mins < 0) {
            throw new Error(`Invalid minutes for difficulty ${diff}: ${mins}. Must be a non-negative integer.`);
        }
    }
    const emptyDayMinutes = options?.emptyDayMinutes ?? DEFAULT_EMPTY_DAY_MINUTES;
    if (!Number.isInteger(emptyDayMinutes) || emptyDayMinutes < 0) {
        throw new Error(`Invalid emptyDayMinutes: ${emptyDayMinutes}. Must be a non-negative integer.`);
    }
    // 3. Compute scores and deduplicate questions
    const questionScores = calculateQuestionSchedulingScores(requirements, questions);
    // Map question ID to its question object and score for fast lookups
    const questionMap = new Map();
    for (const q of questions) {
        if (q && typeof q.id === "string" && !questionMap.has(q.id)) {
            questionMap.set(q.id, q);
        }
    }
    const scoreMap = new Map();
    for (const s of questionScores) {
        scoreMap.set(s.questionId, s);
    }
    // 4. Sort questions: score descending, tie-break preserves original input order
    // Attach original index for stable tie-breaking
    const indexedScores = questionScores.map((scoreObj, originalIndex) => ({
        scoreObj,
        originalIndex,
    }));
    indexedScores.sort((a, b) => {
        if (b.scoreObj.score !== a.scoreObj.score) {
            return b.scoreObj.score - a.scoreObj.score;
        }
        return a.originalIndex - b.originalIndex;
    });
    // 5. Initialize days structure (1..daysAvailable)
    const days = [];
    for (let i = 1; i <= daysAvailable; i++) {
        days.push({
            day: i,
            focus: FOCUS_REVIEW,
            question_ids: [],
            minutes: emptyDayMinutes,
        });
    }
    // 6. Round-robin allocation: sorted question i -> day (i % daysAvailable)
    const scheduledQuestionIds = [];
    for (let i = 0; i < indexedScores.length; i++) {
        const { scoreObj } = indexedScores[i];
        const targetDayIndex = i % daysAvailable;
        days[targetDayIndex].question_ids.push(scoreObj.questionId);
        scheduledQuestionIds.push(scoreObj.questionId);
    }
    // 7. Calculate focus and minutes for each day
    for (const day of days) {
        if (day.question_ids.length === 0) {
            day.focus = FOCUS_REVIEW;
            day.minutes = emptyDayMinutes;
        }
        else {
            let dayHasMust = false;
            let totalMinutes = 0;
            for (const qId of day.question_ids) {
                const scoreObj = scoreMap.get(qId);
                if (scoreObj?.hasMustRequirement) {
                    dayHasMust = true;
                }
                const q = questionMap.get(qId);
                const difficulty = q?.difficulty ?? 1;
                totalMinutes += minutesConfig[difficulty];
            }
            day.focus = dayHasMust ? FOCUS_MUST_HAVE : FOCUS_NICE_HAVE;
            day.minutes = totalMinutes;
        }
    }
    // 8. Compute mustRequirementIdsScheduled preserving requirement input order
    const scheduledQuestionSet = new Set(scheduledQuestionIds);
    const mustRequirementIdsScheduled = [];
    for (const req of requirements) {
        if (req.priority === "must") {
            // Check if any scheduled question links to this must requirement
            let isScheduled = false;
            for (const qId of scheduledQuestionSet) {
                const scoreObj = scoreMap.get(qId);
                if (scoreObj?.linkedRequirementIds.includes(req.id)) {
                    isScheduled = true;
                    break;
                }
            }
            if (isScheduled) {
                mustRequirementIdsScheduled.push(req.id);
            }
        }
    }
    return {
        schedule: {
            days_available: daysAvailable,
            days,
        },
        questionScores,
        scheduledQuestionIds,
        unscheduledQuestionIds: [],
        mustRequirementIdsScheduled,
    };
}
