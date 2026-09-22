import { MIN_SCHEDULE_DAYS, MAX_SCHEDULE_DAYS } from "../../constants/index.js";
/**
 * Validates a generated study schedule against domain and consistency rules.
 * Never throws for ordinary invalid input; collects and returns all issues.
 */
export function validateStudySchedule(input) {
    const { schedule, requirements, questions } = input;
    const issues = [];
    // Defensive check for schedule existence
    if (!schedule || typeof schedule !== "object") {
        return {
            valid: false,
            issues: [
                {
                    code: "INVALID_SCHEDULE_OBJECT",
                    message: "Schedule object is missing or invalid.",
                },
            ],
        };
    }
    // 1. schedule.days_available must be integer 1–60
    if (typeof schedule.days_available !== "number" ||
        !Number.isInteger(schedule.days_available) ||
        schedule.days_available < MIN_SCHEDULE_DAYS ||
        schedule.days_available > MAX_SCHEDULE_DAYS) {
        issues.push({
            code: "INVALID_DAYS_AVAILABLE",
            message: `schedule.days_available must be an integer between ${MIN_SCHEDULE_DAYS} and ${MAX_SCHEDULE_DAYS}. Received: ${schedule.days_available}`,
        });
    }
    // Ensure schedule.days is an array
    if (!Array.isArray(schedule.days)) {
        issues.push({
            code: "INVALID_SCHEDULE_DAYS",
            message: "schedule.days must be an array.",
        });
        return { valid: false, issues };
    }
    // 2. schedule.days.length must equal schedule.days_available
    if (schedule.days.length !== schedule.days_available) {
        issues.push({
            code: "DAY_COUNT_MISMATCH",
            message: `schedule.days count (${schedule.days.length}) does not match days_available (${schedule.days_available}).`,
        });
    }
    // Build lookup of known question IDs and deduplicated unique question IDs
    const knownQuestionMap = new Map();
    for (const q of questions) {
        if (q && typeof q.id === "string" && !knownQuestionMap.has(q.id)) {
            knownQuestionMap.set(q.id, q);
        }
    }
    const seenScheduledQuestions = new Set();
    const scheduledQuestionCounts = new Map();
    // 3-7. Validate each day
    for (let i = 0; i < schedule.days.length; i++) {
        const dayObj = schedule.days[i];
        const expectedDayNumber = i + 1;
        // Day number must be exactly sequential 1..days_available
        if (!dayObj || dayObj.day !== expectedDayNumber) {
            issues.push({
                code: "INVALID_DAY_NUMBER",
                message: `Schedule day at index ${i} has day number '${dayObj?.day}', expected '${expectedDayNumber}'.`,
                day: dayObj?.day,
            });
        }
        // Every focus must be a non-empty string
        if (!dayObj?.focus || typeof dayObj.focus !== "string" || dayObj.focus.trim().length === 0) {
            issues.push({
                code: "EMPTY_FOCUS",
                message: `Schedule day ${dayObj?.day ?? expectedDayNumber} has an empty focus label.`,
                day: dayObj?.day ?? expectedDayNumber,
            });
        }
        // Every minutes value must be a non-negative integer
        if (typeof dayObj?.minutes !== "number" ||
            !Number.isInteger(dayObj.minutes) ||
            dayObj.minutes < 0) {
            issues.push({
                code: "INVALID_MINUTES",
                message: `Schedule day ${dayObj?.day ?? expectedDayNumber} has invalid minutes '${dayObj?.minutes}'. Must be a non-negative integer.`,
                day: dayObj?.day ?? expectedDayNumber,
            });
        }
        // Inspect question IDs in this day
        if (Array.isArray(dayObj?.question_ids)) {
            for (const qId of dayObj.question_ids) {
                // Unknown question ID check
                if (!knownQuestionMap.has(qId)) {
                    issues.push({
                        code: "UNKNOWN_QUESTION_ID",
                        message: `Schedule day ${dayObj.day} references unknown question ID: '${qId}'.`,
                        day: dayObj.day,
                        questionId: qId,
                    });
                }
                // Duplicate scheduled question check
                const currentCount = scheduledQuestionCounts.get(qId) || 0;
                scheduledQuestionCounts.set(qId, currentCount + 1);
                if (currentCount === 1) {
                    // Flagged only once upon first duplicate detection
                    issues.push({
                        code: "DUPLICATE_SCHEDULED_QUESTION",
                        message: `Question ID '${qId}' is scheduled more than once across the schedule.`,
                        day: dayObj.day,
                        questionId: qId,
                    });
                }
                seenScheduledQuestions.add(qId);
            }
        }
    }
    // 8. Every valid unique question ID in questions must appear exactly once in schedule
    for (const [qId] of knownQuestionMap) {
        if (!seenScheduledQuestions.has(qId)) {
            issues.push({
                code: "UNSCHEDULED_QUESTION",
                message: `Question ID '${qId}' from input questions was not scheduled.`,
                questionId: qId,
            });
        }
    }
    // 9. Every must-have requirement must have at least one linked scheduled question
    // Collect all requirements linked by scheduled questions
    const coveredByScheduled = new Set();
    for (const qId of seenScheduledQuestions) {
        const qObj = knownQuestionMap.get(qId);
        if (qObj && Array.isArray(qObj.requirement_ids)) {
            for (const rId of qObj.requirement_ids) {
                coveredByScheduled.add(rId);
            }
        }
    }
    for (const req of requirements) {
        if (req.priority === "must" && !coveredByScheduled.has(req.id)) {
            issues.push({
                code: "UNSCHEDULED_MUST_REQUIREMENT",
                message: `Must-have requirement '${req.id}' ('${req.text}') has no scheduled questions covering it.`,
                requirementId: req.id,
            });
        }
    }
    return {
        valid: issues.length === 0,
        issues,
    };
}
