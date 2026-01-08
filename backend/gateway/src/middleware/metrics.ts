import { NextFunction, Request, Response } from "express";
import {
  httpRequestDuration,
  httpRequestsInProgress,
  httpRequestTotal,
} from "../monitoring/metrics";

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const route = req.path;
  const method = req.method;

  // Increment in-progress requests
  httpRequestsInProgress.inc({ method, route });

  // Capture response finish event
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();

    // Record metrics
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );
    httpRequestTotal.inc({ method, route, status_code: statusCode });
    httpRequestsInProgress.dec({ method, route });
  });

  next();
};
