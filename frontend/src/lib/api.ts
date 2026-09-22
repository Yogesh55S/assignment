/**
 * API client helper for AI Interview Prep Kit.
 * Uses native fetch with credentials: 'include' for secure HTTP-only cookie authentication.
 * Never stores or accesses backend secrets.
 */

import type {
  CreateKitInput,
  InterviewPrepKit,
} from "@interview-prep/shared/types/kit";
import type {
  EditableInterviewPrepKit,
  RegenerateSectionRequest,
  PracticeSubmissionPayload,
  PracticeProgressResponse,
} from "@interview-prep/shared/types/editableKit";

export type { PracticeProgressResponse };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
}

export class ApiException extends Error {
  public code: string;
  public status: number;
  public requestId?: string;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "ApiException";
    this.status = status;
    this.code = error.code || "UNKNOWN_ERROR";
    this.requestId = error.requestId;
  }
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    credentials: "include", // Send and receive HTTP-only cookies
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  let data: Record<string, unknown> | null = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorPayload: ApiError = (data?.error as ApiError) || {
      code: `HTTP_${response.status}`,
      message: response.statusText || "A network error occurred.",
    };
    throw new ApiException(response.status, errorPayload);
  }

  return data as T;
}

// User types
export interface UserSession {
  id: string;
  email: string;
}

export interface KitSummaryItem {
  _id: string;
  generationStatus: "draft" | "generating" | "ready" | "failed";
  kit: EditableInterviewPrepKit | null;
  createdAt: string;
  updatedAt: string;
}

export interface KitDetailResponse {
  kit: {
    _id: string;
    userId: string;
    generationStatus: "draft" | "generating" | "ready" | "failed";
    generationError?: { code: string; message: string };
    warnings?: Array<{ code: string; message: string }>;
    kit: EditableInterviewPrepKit;
    requestFingerprint: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CreateKitResponse {
  kit: KitDetailResponse["kit"];
  reused: boolean;
  warnings?: Array<{ code: string; message: string }>;
  kitId?: string;
  status?: string;
  message?: string;
}

export interface KitStatusResponse {
  id: string;
  status: "draft" | "generating" | "ready" | "failed";
  error: { code: string; message: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegenerateSectionResponse {
  kit: KitDetailResponse["kit"];
  preservedEditedContent: boolean;
  regeneratedCount: number;
  preservedCount: number;
  warnings: Array<{ code: string; message: string }>;
}

// API Methods

export async function getCurrentUser(): Promise<{ user: UserSession }> {
  return apiRequest<{ user: UserSession }>("/api/auth/me");
}

export async function listKits(): Promise<{ kits: KitSummaryItem[] }> {
  return apiRequest<{ kits: KitSummaryItem[] }>("/api/kits");
}

export async function getKit(id: string): Promise<KitDetailResponse> {
  return apiRequest<KitDetailResponse>(`/api/kits/${id}`);
}

export async function getKitStatus(id: string): Promise<KitStatusResponse> {
  return apiRequest<KitStatusResponse>(`/api/kits/${id}/status`);
}

export async function createKit(
  input: CreateKitInput,
  signal?: AbortSignal
): Promise<CreateKitResponse> {
  return apiRequest<CreateKitResponse>("/api/kits", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export async function updateKit(
  id: string,
  kit: EditableInterviewPrepKit,
  clientUpdatedAt?: string
): Promise<KitDetailResponse> {
  return apiRequest<KitDetailResponse>(`/api/kits/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      kit,
      clientUpdatedAt,
    }),
  });
}

export async function deleteKit(id: string): Promise<void> {
  await apiRequest<void>(`/api/kits/${id}`, {
    method: "DELETE",
  });
}

export async function regenerateKitSection(
  id: string,
  request: RegenerateSectionRequest,
  clientUpdatedAt?: string
): Promise<RegenerateSectionResponse> {
  return apiRequest<RegenerateSectionResponse>(`/api/kits/${id}/regenerate`, {
    method: "POST",
    body: JSON.stringify({
      ...request,
      clientUpdatedAt,
    }),
  });
}

export async function getPracticeProgress(id: string): Promise<PracticeProgressResponse> {
  return apiRequest<PracticeProgressResponse>(`/api/kits/${id}/practice`);
}

export async function savePracticeResult(
  id: string,
  payload: PracticeSubmissionPayload
): Promise<{ progress: unknown }> {
  return apiRequest<{ progress: unknown }>(`/api/kits/${id}/practice`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
