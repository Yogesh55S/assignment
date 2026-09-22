export declare const MIN_SCHEDULE_DAYS = 1;
export declare const MAX_SCHEDULE_DAYS = 60;
export declare const MAX_JD_LENGTH = 50000;
export declare const MIN_PASSWORD_LENGTH = 8;
export declare const AUTH_COOKIE_NAME = "token";
export declare const JWT_EXPIRES_IN = "7d";
export declare const JWT_ISSUER = "ai-interview-prep-kit";
export declare const JWT_AUDIENCE = "ai-interview-prep-kit-users";
export declare const DEFAULT_PORT = 5000;
export declare const DEFAULT_MINUTES_BY_DIFFICULTY: {
    readonly 1: 10;
    readonly 2: 15;
    readonly 3: 20;
};
export declare const DEFAULT_EMPTY_DAY_MINUTES = 15;
export declare const PRIORITY_WEIGHT_MUST = 100;
export declare const PRIORITY_WEIGHT_NICE = 20;
export declare const PRIORITY_WEIGHT_NONE = 0;
export declare const DIFFICULTY_WEIGHT_MAP: {
    readonly 1: 10;
    readonly 2: 20;
    readonly 3: 30;
};
export declare const FOCUS_MUST_HAVE = "Must-have requirements";
export declare const FOCUS_NICE_HAVE = "Nice-to-have and supporting topics";
export declare const FOCUS_REVIEW = "Review and practice";
