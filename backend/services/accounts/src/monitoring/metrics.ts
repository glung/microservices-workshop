import client from "prom-client";

const register = new client.Registry();

register.setDefaultLabels({
  app: "accounts-service",
});

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const httpRequestsInProgress = new client.Gauge({
  name: "http_requests_in_progress",
  help: "Number of HTTP requests currently in progress",
  labelNames: ["method", "route"],
});

export const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});

export const dbConnectionsActive = new client.Gauge({
  name: "db_connections_active",
  help: "Number of active database connections",
});

export const dbQueryTotal = new client.Counter({
  name: "db_queries_total",
  help: "Total number of database queries",
  labelNames: ["operation", "status"],
});

export const subscriptionUpgrades = new client.Counter({
  name: "subscription_upgrades_total",
  help: "Total number of subscription upgrades",
});

export const errorTotal = new client.Counter({
  name: "errors_total",
  help: "Total number of errors",
  labelNames: ["type", "endpoint"],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestsInProgress);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(dbQueryTotal);
register.registerMetric(subscriptionUpgrades);
register.registerMetric(errorTotal);

export { register };
