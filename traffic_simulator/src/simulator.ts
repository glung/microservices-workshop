import axios from "axios";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import {
  createTempDataFile,
  deleteTempFile,
  LOAD_CONFIGS,
  getRandomCourseId,
  replaceTemplateVariables,
  USER_FLOWS,
} from "./flows";
import {
  ABResult,
  FlowConfig,
  LoadLevel,
  SimulatorConfig,
  SimulatorResult,
  TestUser,
} from "./types";

export class TrafficSimulator {
  private config: SimulatorConfig;
  private testUsers: TestUser[] = [];
  private tempFiles: string[] = [];

  constructor(baseURL: string, loadLevel: LoadLevel) {
    this.config = {
      baseURL,
      loadLevel,
      flows: USER_FLOWS,
    };
  }

  async run(): Promise<SimulatorResult> {
    const loadConfig = LOAD_CONFIGS[this.config.loadLevel];
    console.log("\nStarting Course Platform Traffic Simulator");
    console.log("===========================================");
    console.log(`Load Level: ${this.config.loadLevel}`);
    console.log(`Base URL: ${this.config.baseURL}`);
    console.log(`Total Requests: ${loadConfig.totalRequests}`);
    console.log(`Concurrency: ${loadConfig.concurrency}`);
    console.log(`Target: ${loadConfig.requestsPerSecond} req/s\n`);

    // Check if ab is installed
    await this.checkApacheBench();

    // Check if backend is running
    await this.checkBackend();

    // Phase 1: Setup
    console.log("Phase 1: Setup");
    console.log("==============");
    await this.setupTestUsers();

    // Phase 2: Load Generation
    console.log("\nPhase 2: Load Generation");
    console.log("========================");
    const results = await this.generateLoad();

    // Cleanup
    this.cleanup();

    return this.aggregateResults(results);
  }

  private async checkApacheBench(): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn("which", ["ab"]);

      process.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              "Apache Bench (ab) is not installed. Install it with: brew install httpd (macOS) or apt-get install apache2-utils (Linux)"
            )
          );
        } else {
          resolve();
        }
      });
    });
  }

  private async checkBackend(): Promise<void> {
    try {
      const response = await axios.get(`${this.config.baseURL}/health`);
      if (response.data.status === "healthy") {
        console.log("✓ Backend is running\n");
      } else {
        throw new Error("Backend is not healthy");
      }
    } catch (err) {
      throw new Error(
        `Backend is not accessible at ${this.config.baseURL}. Make sure it's running with: cd backend && docker compose up`
      );
    }
  }

  private async setupTestUsers(): Promise<void> {
    const userCount = 10;

    for (let i = 0; i < userCount; i++) {
      let email: string;
      let password: string;
      let name: string;
      if (i === 0) {
        // First user is always the same for easier testing
        email = `testuser@example.com`;
        password = "password123";
        name = `Test User`;
      } else {
        const uuid = uuidv4();
        email = `testuser-${uuid}@example.com`;
        password = "password123";
        name = `Test User ${uuid}`;
      }

      console.log(`→ Setting up user: ${email}`);

      try {
        // Register user
        await axios.post(`${this.config.baseURL}/api/auth/register`, {
          email,
          password,
          name,
          subscriptionKind: i % 2 === 0 ? "Free" : "Max",
        });

        // Login to get token
        const loginResponse = await axios.post(
          `${this.config.baseURL}/api/auth/login`,
          {
            email,
            password,
          }
        );

        this.testUsers.push({
          email,
          password,
          name,
          token: loginResponse.data.token,
        });
      } catch (err) {
        // User might already exist, try to login
        try {
          const loginResponse = await axios.post(
            `${this.config.baseURL}/api/auth/login`,
            {
              email,
              password,
            }
          );

          this.testUsers.push({
            email,
            password,
            name,
            token: loginResponse.data.token,
          });
        } catch (loginErr) {
          console.error(`Failed to setup user ${email}`);
        }
      }
    }

    console.log(`✓ Created ${this.testUsers.length} test users`);
    console.log("✓ Collected authentication tokens");
  }

  private async generateLoad(): Promise<ABResult[]> {
    const loadConfig = LOAD_CONFIGS[this.config.loadLevel];
    const results: ABResult[] = [];

    for (const flow of this.config.flows) {
      const requestCount = Math.floor(
        loadConfig.totalRequests * (flow.percentage / 100)
      );

      if (requestCount === 0) continue;

      console.log(
        `→ ${flow.name}: ${requestCount} requests (${flow.percentage}%)`
      );

      const result = await this.runApacheBench(
        flow,
        requestCount,
        loadConfig.concurrency
      );
      results.push(result);
    }

    return results;
  }

  private async runApacheBench(
    flow: FlowConfig,
    requests: number,
    concurrency: number
  ): Promise<ABResult> {
    // Ensure concurrency doesn't exceed request count
    const effectiveConcurrency = Math.min(concurrency, requests);

    const args: string[] = [
      "-n",
      requests.toString(),
      "-c",
      effectiveConcurrency.toString(),
      "-q", // Quiet mode
    ];

    // Add auth header if required
    if (flow.requiresAuth && this.testUsers.length > 0) {
      const randomUser =
        this.testUsers[Math.floor(Math.random() * this.testUsers.length)];
      args.push("-H", `Authorization: Bearer ${randomUser.token}`);
    }

    // Handle POST/DELETE requests with body
    let dataFile: string | null = null;
    if (flow.method === "POST" && flow.body) {
      const data = flow.body;
      dataFile = createTempDataFile(data);
      this.tempFiles.push(dataFile);
      args.push("-p", dataFile);
      args.push("-T", "application/json");
    }

    // Build URL
    let url = `${this.config.baseURL}${flow.endpoint}`;
    if (flow.endpoint.includes("{{courseId}}")) {
      url = replaceTemplateVariables(url, { courseId: getRandomCourseId() });
    }

    // Add URL
    if (flow.method === "DELETE") {
      args.push("-m", "DELETE");
    }
    args.push(url);

    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = "";
      let stderr = "";

      const process = spawn("ab", args);

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      process.on("close", (_code) => {
        const duration = (Date.now() - startTime) / 1000;

        // Parse ab output
        const successfulMatch = stdout.match(/Complete requests:\s+(\d+)/);
        const failedMatch = stdout.match(/Failed requests:\s+(\d+)/);

        const successful = successfulMatch ? parseInt(successfulMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : requests;

        // Log errors if no successful requests
        if (successful === 0 && stderr) {
          console.error(`  ✗ Error in ${flow.name}:`, stderr.split('\n')[0]);
        }

        resolve({
          endpoint: flow.name,
          totalRequests: requests,
          successfulRequests: successful,
          failedRequests: failed,
          duration,
          requestsPerSecond: successful / duration,
        });
      });
    });
  }

  private aggregateResults(results: ABResult[]): SimulatorResult {
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const successfulRequests = results.reduce(
      (sum, r) => sum + r.successfulRequests,
      0
    );
    const totalDuration = Math.max(...results.map((r) => r.duration));

    return {
      totalRequests,
      totalDuration,
      averageRPS: successfulRequests / totalDuration,
      successRate: (successfulRequests / totalRequests) * 100,
      results,
    };
  }

  private cleanup(): void {
    for (const file of this.tempFiles) {
      deleteTempFile(file);
    }
  }
}
