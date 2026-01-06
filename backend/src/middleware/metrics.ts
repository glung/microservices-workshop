import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal, httpRequestsInProgress } from '../monitoring/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const route = req.route?.path || req.path;

  httpRequestsInProgress.inc({ method: req.method, route });

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString()
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
    httpRequestsInProgress.dec({ method: req.method, route });
  });

  next();
};
