export type LlmJsonRequest = {
  systemInstruction: string;
  userPrompt: string;
  schemaName: string;
  timeoutMs?: number;
  maxRetries?: number;
  temperature?: number;
};

export type LlmUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type LlmJsonResponse<T> = {
  data: T;
  rawText: string;
  model: string;
  usage?: LlmUsage;
};

export type LlmClient = {
  generateJson<T>(request: LlmJsonRequest): Promise<LlmJsonResponse<T>>;
};
