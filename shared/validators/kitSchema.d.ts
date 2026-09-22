import { z } from "zod";
import type { InterviewPrepKit } from "../types/kit.js";
export declare const requirementKindSchema: z.ZodEnum<["technical", "behavioural", "domain"]>;
export declare const requirementPrioritySchema: z.ZodEnum<["must", "nice"]>;
export declare const requirementSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    kind: z.ZodEnum<["technical", "behavioural", "domain"]>;
    priority: z.ZodEnum<["must", "nice"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    text: string;
    kind: "technical" | "behavioural" | "domain";
    priority: "must" | "nice";
}, {
    id: string;
    text: string;
    kind: "technical" | "behavioural" | "domain";
    priority: "must" | "nice";
}>;
export declare const questionCategorySchema: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
export declare const interviewQuestionSchema: z.ZodObject<{
    id: z.ZodString;
    requirement_ids: z.ZodArray<z.ZodString, "many">;
    category: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
    prompt: z.ZodString;
    answer_outline: z.ZodString;
    difficulty: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    requirement_ids: string[];
    category: "technical" | "behavioural" | "system-design" | "company-fit";
    prompt: string;
    answer_outline: string;
    difficulty: number;
}, {
    id: string;
    requirement_ids: string[];
    category: "technical" | "behavioural" | "system-design" | "company-fit";
    prompt: string;
    answer_outline: string;
    difficulty: number;
}>;
export declare const flashcardSchema: z.ZodObject<{
    id: z.ZodString;
    front: z.ZodString;
    back: z.ZodString;
    requirement_ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    requirement_ids: string[];
    front: string;
    back: string;
}, {
    id: string;
    requirement_ids: string[];
    front: string;
    back: string;
}>;
export declare const scheduleDaySchema: z.ZodObject<{
    day: z.ZodNumber;
    focus: z.ZodString;
    question_ids: z.ZodArray<z.ZodString, "many">;
    minutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    day: number;
    focus: string;
    question_ids: string[];
    minutes: number;
}, {
    day: number;
    focus: string;
    question_ids: string[];
    minutes: number;
}>;
export declare const scheduleSchema: z.ZodObject<{
    days_available: z.ZodNumber;
    days: z.ZodArray<z.ZodObject<{
        day: z.ZodNumber;
        focus: z.ZodString;
        question_ids: z.ZodArray<z.ZodString, "many">;
        minutes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        day: number;
        focus: string;
        question_ids: string[];
        minutes: number;
    }, {
        day: number;
        focus: string;
        question_ids: string[];
        minutes: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    days_available: number;
    days: {
        day: number;
        focus: string;
        question_ids: string[];
        minutes: number;
    }[];
}, {
    days_available: number;
    days: {
        day: number;
        focus: string;
        question_ids: string[];
        minutes: number;
    }[];
}>;
export declare const kitSourceSchema: z.ZodObject<{
    company: z.ZodString;
    company_url: z.ZodString;
    role: z.ZodString;
    location: z.ZodString;
    jd_chars: z.ZodNumber;
    researched_at: z.ZodString;
    pages_used: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
}, {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
}>;
export declare const companyBriefSchema: z.ZodObject<{
    summary: z.ZodString;
    what_they_do: z.ZodString;
    sources: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    summary: string;
    what_they_do: string;
    sources: string[];
}, {
    summary: string;
    what_they_do: string;
    sources: string[];
}>;
export declare const roleSchema: z.ZodObject<{
    title: z.ZodString;
    seniority: z.ZodString;
    responsibilities: z.ZodArray<z.ZodString, "many">;
    requirements: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        kind: z.ZodEnum<["technical", "behavioural", "domain"]>;
        priority: z.ZodEnum<["must", "nice"]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        kind: "technical" | "behavioural" | "domain";
        priority: "must" | "nice";
    }, {
        id: string;
        text: string;
        kind: "technical" | "behavioural" | "domain";
        priority: "must" | "nice";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: {
        id: string;
        text: string;
        kind: "technical" | "behavioural" | "domain";
        priority: "must" | "nice";
    }[];
}, {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: {
        id: string;
        text: string;
        kind: "technical" | "behavioural" | "domain";
        priority: "must" | "nice";
    }[];
}>;
export declare const coverageSchema: z.ZodObject<{
    uncovered_requirement_ids: z.ZodArray<z.ZodString, "many">;
    passes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    uncovered_requirement_ids: string[];
    passes: number;
}, {
    uncovered_requirement_ids: string[];
    passes: number;
}>;
export declare const interviewPrepKitBaseSchema: z.ZodObject<{
    source: z.ZodObject<{
        company: z.ZodString;
        company_url: z.ZodString;
        role: z.ZodString;
        location: z.ZodString;
        jd_chars: z.ZodNumber;
        researched_at: z.ZodString;
        pages_used: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    }, {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    }>;
    company_brief: z.ZodObject<{
        summary: z.ZodString;
        what_they_do: z.ZodString;
        sources: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        what_they_do: string;
        sources: string[];
    }, {
        summary: string;
        what_they_do: string;
        sources: string[];
    }>;
    role: z.ZodObject<{
        title: z.ZodString;
        seniority: z.ZodString;
        responsibilities: z.ZodArray<z.ZodString, "many">;
        requirements: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            kind: z.ZodEnum<["technical", "behavioural", "domain"]>;
            priority: z.ZodEnum<["must", "nice"]>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }, {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    }, {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    }>;
    questions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        requirement_ids: z.ZodArray<z.ZodString, "many">;
        category: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
        prompt: z.ZodString;
        answer_outline: z.ZodString;
        difficulty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }>, "many">;
    flashcards: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        front: z.ZodString;
        back: z.ZodString;
        requirement_ids: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }>, "many">;
    schedule: z.ZodObject<{
        days_available: z.ZodNumber;
        days: z.ZodArray<z.ZodObject<{
            day: z.ZodNumber;
            focus: z.ZodString;
            question_ids: z.ZodArray<z.ZodString, "many">;
            minutes: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }, {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    }, {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    }>;
    coverage: z.ZodObject<{
        uncovered_requirement_ids: z.ZodArray<z.ZodString, "many">;
        passes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        uncovered_requirement_ids: string[];
        passes: number;
    }, {
        uncovered_requirement_ids: string[];
        passes: number;
    }>;
}, "strip", z.ZodTypeAny, {
    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }[];
    schedule: {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    };
    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    };
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    };
    flashcards: {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }[];
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}, {
    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }[];
    schedule: {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    };
    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    };
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    };
    flashcards: {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }[];
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}>;
export declare const interviewPrepKitSchema: z.ZodEffects<z.ZodObject<{
    source: z.ZodObject<{
        company: z.ZodString;
        company_url: z.ZodString;
        role: z.ZodString;
        location: z.ZodString;
        jd_chars: z.ZodNumber;
        researched_at: z.ZodString;
        pages_used: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    }, {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    }>;
    company_brief: z.ZodObject<{
        summary: z.ZodString;
        what_they_do: z.ZodString;
        sources: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        what_they_do: string;
        sources: string[];
    }, {
        summary: string;
        what_they_do: string;
        sources: string[];
    }>;
    role: z.ZodObject<{
        title: z.ZodString;
        seniority: z.ZodString;
        responsibilities: z.ZodArray<z.ZodString, "many">;
        requirements: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            kind: z.ZodEnum<["technical", "behavioural", "domain"]>;
            priority: z.ZodEnum<["must", "nice"]>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }, {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    }, {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    }>;
    questions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        requirement_ids: z.ZodArray<z.ZodString, "many">;
        category: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
        prompt: z.ZodString;
        answer_outline: z.ZodString;
        difficulty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }>, "many">;
    flashcards: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        front: z.ZodString;
        back: z.ZodString;
        requirement_ids: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }>, "many">;
    schedule: z.ZodObject<{
        days_available: z.ZodNumber;
        days: z.ZodArray<z.ZodObject<{
            day: z.ZodNumber;
            focus: z.ZodString;
            question_ids: z.ZodArray<z.ZodString, "many">;
            minutes: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }, {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    }, {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    }>;
    coverage: z.ZodObject<{
        uncovered_requirement_ids: z.ZodArray<z.ZodString, "many">;
        passes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        uncovered_requirement_ids: string[];
        passes: number;
    }, {
        uncovered_requirement_ids: string[];
        passes: number;
    }>;
}, "strip", z.ZodTypeAny, {
    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }[];
    schedule: {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    };
    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    };
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    };
    flashcards: {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }[];
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}, {
    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }[];
    schedule: {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    };
    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    };
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    };
    flashcards: {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }[];
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}>, {
    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }[];
    schedule: {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    };
    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    };
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    };
    flashcards: {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }[];
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}, {
    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: number;
    }[];
    schedule: {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    };
    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
        }[];
    };
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    };
    flashcards: {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
    }[];
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}>;
/**
 * Validates input against the InterviewPrepKit schema.
 * Throws a ZodError if validation fails, otherwise returns typed InterviewPrepKit.
 */
export declare function validateInterviewPrepKit(input: unknown): InterviewPrepKit;
export declare const createKitInputSchema: z.ZodObject<{
    jd: z.ZodString;
    company_url: z.ZodEffects<z.ZodString, string, string>;
    days: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    days: number;
    company_url: string;
    jd: string;
}, {
    days: number;
    company_url: string;
    jd: string;
}>;
export declare const registerInputSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const loginInputSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
