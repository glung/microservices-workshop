import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FlowConfig, LoadConfig, LoadLevel } from "./types";

export const LOAD_CONFIGS: Record<LoadLevel, LoadConfig> = {
  low: {
    totalRequests: 1000,
    concurrency: 100,
    requestsPerSecond: 200,
  },
  high: {
    totalRequests: 5000,
    concurrency: 500,
    requestsPerSecond: 1000,
  },
};

export const USER_FLOWS: FlowConfig[] = [
  {
    name: "User Login",
    endpoint: "/api/auth/login",
    method: "POST",
    percentage: 20,
    requiresAuth: false,
    body: {
      email: "testuser@example.com",
      password: "password123",
    },
  },
  {
    name: "Catalog Browsing (Public)",
    endpoint: "/api/catalog",
    method: "GET",
    percentage: 20,
    requiresAuth: false,
  },
  {
    name: "Catalog Browsing (Auth)",
    endpoint: "/api/catalog",
    method: "GET",
    percentage: 20,
    requiresAuth: true,
  },
  {
    name: "Course Viewing",
    endpoint: "/api/courses/{{courseId}}",
    method: "GET",
    percentage: 20,
    requiresAuth: false,
  },
  {
    name: "Course Like",
    endpoint: "/api/courses/{{courseId}}/like",
    method: "POST",
    percentage: 5,
    requiresAuth: true,
    body: {},
  },
  {
    name: "Course Unlike",
    endpoint: "/api/courses/{{courseId}}/like",
    method: "DELETE",
    percentage: 5,
    requiresAuth: true,
  },
];

export function createTempDataFile(data: Record<string, unknown>): string {
  const tempDir = os.tmpdir();
  const fileName = `ab-data-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.json`;
  const filePath = path.join(tempDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(data));

  return filePath;
}

export function deleteTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete temp file ${filePath}:`, err);
  }
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }

  return result;
}

export function getRandomCourseId(): number {
  return Math.floor(Math.random() * 5) + 1;
}
