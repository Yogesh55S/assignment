import { z } from "zod";
import type { InterviewPrepKit } from "../types/kit.js";
import type { EditableInterviewPrepKit } from "../types/editableKit.js";
export declare const questionMetaSchema: z.ZodObject<{
    origin: z.ZodEnum<["generated", "user"]>;
    edited: z.ZodBoolean;
    pinned: z.ZodBoolean;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    origin: "generated" | "user";
    edited: boolean;
    pinned: boolean;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    origin: "generated" | "user";
    edited: boolean;
    pinned: boolean;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
export declare const flashcardMetaSchema: z.ZodObject<{
    origin: z.ZodEnum<["generated", "user"]>;
    edited: z.ZodBoolean;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    origin: "generated" | "user";
    edited: boolean;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    origin: "generated" | "user";
    edited: boolean;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
export declare const companyBriefMetaSchema: z.ZodObject<{
    edited: z.ZodBoolean;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    edited: boolean;
    updatedAt?: string | undefined;
}, {
    edited: boolean;
    updatedAt?: string | undefined;
}>;
export declare const editableCompanyBriefSchema: z.ZodObject<{
    summary: z.ZodString;
    what_they_do: z.ZodString;
    sources: z.ZodArray<z.ZodString, "many">;
    _meta: z.ZodOptional<z.ZodObject<{
        edited: z.ZodBoolean;
        updatedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        edited: boolean;
        updatedAt?: string | undefined;
    }, {
        edited: boolean;
        updatedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    summary: string;
    what_they_do: string;
    sources: string[];
    _meta?: {
        edited: boolean;
        updatedAt?: string | undefined;
    } | undefined;
}, {
    summary: string;
    what_they_do: string;
    sources: string[];
    _meta?: {
        edited: boolean;
        updatedAt?: string | undefined;
    } | undefined;
}>;
export declare const editableInterviewQuestionSchema: z.ZodObject<{
    id: z.ZodString;
    requirement_ids: z.ZodArray<z.ZodString, "many">;
    category: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
    prompt: z.ZodString;
    answer_outline: z.ZodString;
    difficulty: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
    _meta: z.ZodOptional<z.ZodObject<{
        origin: z.ZodEnum<["generated", "user"]>;
        edited: z.ZodBoolean;
        pinned: z.ZodBoolean;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        origin: "generated" | "user";
        edited: boolean;
        pinned: boolean;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }, {
        origin: "generated" | "user";
        edited: boolean;
        pinned: boolean;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    requirement_ids: string[];
    category: "technical" | "behavioural" | "system-design" | "company-fit";
    prompt: string;
    answer_outline: string;
    difficulty: 1 | 2 | 3;
    _meta?: {
        origin: "generated" | "user";
        edited: boolean;
        pinned: boolean;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    } | undefined;
}, {
    id: string;
    requirement_ids: string[];
    category: "technical" | "behavioural" | "system-design" | "company-fit";
    prompt: string;
    answer_outline: string;
    difficulty: 1 | 2 | 3;
    _meta?: {
        origin: "generated" | "user";
        edited: boolean;
        pinned: boolean;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    } | undefined;
}>;
export declare const editableFlashcardSchema: z.ZodObject<{
    id: z.ZodString;
    front: z.ZodString;
    back: z.ZodString;
    requirement_ids: z.ZodArray<z.ZodString, "many">;
    _meta: z.ZodOptional<z.ZodObject<{
        origin: z.ZodEnum<["generated", "user"]>;
        edited: z.ZodBoolean;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        origin: "generated" | "user";
        edited: boolean;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }, {
        origin: "generated" | "user";
        edited: boolean;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    requirement_ids: string[];
    front: string;
    back: string;
    _meta?: {
        origin: "generated" | "user";
        edited: boolean;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    } | undefined;
}, {
    id: string;
    requirement_ids: string[];
    front: string;
    back: string;
    _meta?: {
        origin: "generated" | "user";
        edited: boolean;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
    } | undefined;
}>;
export declare const editableInterviewPrepKitBaseSchema: z.ZodObject<{
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
        _meta: z.ZodOptional<z.ZodObject<{
            edited: z.ZodBoolean;
            updatedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            edited: boolean;
            updatedAt?: string | undefined;
        }, {
            edited: boolean;
            updatedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        what_they_do: string;
        sources: string[];
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
    }, {
        summary: string;
        what_they_do: string;
        sources: string[];
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
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
        difficulty: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
        _meta: z.ZodOptional<z.ZodObject<{
            origin: z.ZodEnum<["generated", "user"]>;
            edited: z.ZodBoolean;
            pinned: z.ZodBoolean;
            createdAt: z.ZodOptional<z.ZodString>;
            updatedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        }, {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
    }, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
    }>, "many">;
    flashcards: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        front: z.ZodString;
        back: z.ZodString;
        requirement_ids: z.ZodArray<z.ZodString, "many">;
        _meta: z.ZodOptional<z.ZodObject<{
            origin: z.ZodEnum<["generated", "user"]>;
            edited: z.ZodBoolean;
            createdAt: z.ZodOptional<z.ZodString>;
            updatedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        }, {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
    }, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
    }[];
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}>;
export declare const editableInterviewPrepKitSchema: z.ZodEffects<z.ZodObject<{
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
        _meta: z.ZodOptional<z.ZodObject<{
            edited: z.ZodBoolean;
            updatedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            edited: boolean;
            updatedAt?: string | undefined;
        }, {
            edited: boolean;
            updatedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        what_they_do: string;
        sources: string[];
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
    }, {
        summary: string;
        what_they_do: string;
        sources: string[];
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
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
        difficulty: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
        _meta: z.ZodOptional<z.ZodObject<{
            origin: z.ZodEnum<["generated", "user"]>;
            edited: z.ZodBoolean;
            pinned: z.ZodBoolean;
            createdAt: z.ZodOptional<z.ZodString>;
            updatedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        }, {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
    }, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
    }>, "many">;
    flashcards: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        front: z.ZodString;
        back: z.ZodString;
        requirement_ids: z.ZodArray<z.ZodString, "many">;
        _meta: z.ZodOptional<z.ZodObject<{
            origin: z.ZodEnum<["generated", "user"]>;
            edited: z.ZodBoolean;
            createdAt: z.ZodOptional<z.ZodString>;
            updatedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        }, {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
    }, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            edited: boolean;
            updatedAt?: string | undefined;
        } | undefined;
    };
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            pinned: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
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
        _meta?: {
            origin: "generated" | "user";
            edited: boolean;
            createdAt?: string | undefined;
            updatedAt?: string | undefined;
        } | undefined;
    }[];
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}>;
export declare function validateEditableInterviewPrepKit(input: unknown): EditableInterviewPrepKit;
export declare const regenerateSectionSchema: z.ZodEffects<z.ZodObject<{
    section: z.ZodEnum<["company_brief", "questions", "schedule"]>;
    category: z.ZodOptional<z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>>;
    replaceEdited: z.ZodOptional<z.ZodBoolean>;
    clientUpdatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    section: "company_brief" | "questions" | "schedule";
    category?: "technical" | "behavioural" | "system-design" | "company-fit" | undefined;
    replaceEdited?: boolean | undefined;
    clientUpdatedAt?: string | undefined;
}, {
    section: "company_brief" | "questions" | "schedule";
    category?: "technical" | "behavioural" | "system-design" | "company-fit" | undefined;
    replaceEdited?: boolean | undefined;
    clientUpdatedAt?: string | undefined;
}>, {
    section: "company_brief" | "questions" | "schedule";
    category?: "technical" | "behavioural" | "system-design" | "company-fit" | undefined;
    replaceEdited?: boolean | undefined;
    clientUpdatedAt?: string | undefined;
}, {
    section: "company_brief" | "questions" | "schedule";
    category?: "technical" | "behavioural" | "system-design" | "company-fit" | undefined;
    replaceEdited?: boolean | undefined;
    clientUpdatedAt?: string | undefined;
}>;
export declare const kitUpdatePayloadSchema: z.ZodObject<{
    kit: z.ZodEffects<z.ZodObject<{
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
            _meta: z.ZodOptional<z.ZodObject<{
                edited: z.ZodBoolean;
                updatedAt: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                edited: boolean;
                updatedAt?: string | undefined;
            }, {
                edited: boolean;
                updatedAt?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            summary: string;
            what_they_do: string;
            sources: string[];
            _meta?: {
                edited: boolean;
                updatedAt?: string | undefined;
            } | undefined;
        }, {
            summary: string;
            what_they_do: string;
            sources: string[];
            _meta?: {
                edited: boolean;
                updatedAt?: string | undefined;
            } | undefined;
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
            difficulty: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
            _meta: z.ZodOptional<z.ZodObject<{
                origin: z.ZodEnum<["generated", "user"]>;
                edited: z.ZodBoolean;
                pinned: z.ZodBoolean;
                createdAt: z.ZodOptional<z.ZodString>;
                updatedAt: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            }, {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 1 | 2 | 3;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
        }, {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 1 | 2 | 3;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
        }>, "many">;
        flashcards: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            front: z.ZodString;
            back: z.ZodString;
            requirement_ids: z.ZodArray<z.ZodString, "many">;
            _meta: z.ZodOptional<z.ZodObject<{
                origin: z.ZodEnum<["generated", "user"]>;
                edited: z.ZodBoolean;
                createdAt: z.ZodOptional<z.ZodString>;
                updatedAt: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            }, {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            requirement_ids: string[];
            front: string;
            back: string;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
        }, {
            id: string;
            requirement_ids: string[];
            front: string;
            back: string;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                edited: boolean;
                updatedAt?: string | undefined;
            } | undefined;
        };
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 1 | 2 | 3;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                edited: boolean;
                updatedAt?: string | undefined;
            } | undefined;
        };
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 1 | 2 | 3;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                edited: boolean;
                updatedAt?: string | undefined;
            } | undefined;
        };
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 1 | 2 | 3;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                edited: boolean;
                updatedAt?: string | undefined;
            } | undefined;
        };
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 1 | 2 | 3;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
        }[];
        coverage: {
            uncovered_requirement_ids: string[];
            passes: number;
        };
    }>;
    clientUpdatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    kit: {
        company_brief: {
            summary: string;
            what_they_do: string;
            sources: string[];
            _meta?: {
                edited: boolean;
                updatedAt?: string | undefined;
            } | undefined;
        };
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 1 | 2 | 3;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
        }[];
        coverage: {
            uncovered_requirement_ids: string[];
            passes: number;
        };
    };
    clientUpdatedAt?: string | undefined;
}, {
    kit: {
        company_brief: {
            summary: string;
            what_they_do: string;
            sources: string[];
            _meta?: {
                edited: boolean;
                updatedAt?: string | undefined;
            } | undefined;
        };
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 1 | 2 | 3;
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                pinned: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
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
            _meta?: {
                origin: "generated" | "user";
                edited: boolean;
                createdAt?: string | undefined;
                updatedAt?: string | undefined;
            } | undefined;
        }[];
        coverage: {
            uncovered_requirement_ids: string[];
            passes: number;
        };
    };
    clientUpdatedAt?: string | undefined;
}>;
export declare const practiceSubmissionSchema: z.ZodObject<{
    flashcardId: z.ZodString;
    confidence: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
    covered: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    flashcardId: string;
    confidence: 1 | 2 | 3;
    covered?: boolean | undefined;
}, {
    flashcardId: string;
    confidence: 1 | 2 | 3;
    covered?: boolean | undefined;
}>;
/**
 * Strips internal UI metadata (_meta) recursively without mutating the input object,
 * producing a pristine InterviewPrepKit conforming exactly to Appendix A requirements.
 */
export declare function stripInternalKitMetadata(kit: EditableInterviewPrepKit): InterviewPrepKit;
