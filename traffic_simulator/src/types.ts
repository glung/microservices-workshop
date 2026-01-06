export type LoadLevel = "low" | "high";

export interface LoadConfig {
  totalRequests: number;
  concurrency: number;
  requestsPerSecond: number;
}

export interface FlowConfig {
  name: string;
  endpoint: string;
  method: "GET" | "POST" | "DELETE";
  percentage: number;
  requiresAuth: boolean;
  body?: Record<string, unknown>;
}

export interface SimulatorConfig {
  baseURL: string;
  loadLevel: LoadLevel;
  flows: FlowConfig[];
}

export interface ABResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  duration: number;
  requestsPerSecond: number;
}

export interface SimulatorResult {
  totalRequests: number;
  totalDuration: number;
  averageRPS: number;
  successRate: number;
  results: ABResult[];
}

export interface TestUser {
  email: string;
  password: string;
  name: string;
  token: string;
}
