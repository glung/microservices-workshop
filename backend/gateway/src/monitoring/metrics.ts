import client from "prom-client";

const register = new client.Registry();

register.setDefaultLabels({
  app: "course-platform-gateway",
});

client.collectDefaultMetrics({ register });

// HTTP Metrics
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

// Database Metrics
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

// Business Metrics
export const userRegistrations = new client.Counter({
  name: "user_registrations_total",
  help: "Total number of user registrations",
  labelNames: ["subscription_kind"],
});

export const userLogins = new client.Counter({
  name: "user_logins_total",
  help: "Total number of user logins",
  labelNames: ["status"],
});

export const subscriptionUpgrades = new client.Counter({
  name: "subscription_upgrades_total",
  help: "Total number of subscription upgrades",
});

export const courseLikes = new client.Counter({
  name: "course_likes_total",
  help: "Total number of course likes",
  labelNames: ["action"],
});

export const courseViews = new client.Counter({
  name: "course_views_total",
  help: "Total number of course detail views",
  labelNames: ["course_kind", "access_granted"],
});

export const catalogViews = new client.Counter({
  name: "catalog_views_total",
  help: "Total number of catalog views",
  labelNames: ["authenticated"],
});

export const activeUsers = new client.Gauge({
  name: "active_users_current",
  help: "Current number of active users (users who made a request in the last 5 minutes)",
});

export const coursesTotal = new client.Gauge({
  name: "courses_total",
  help: "Total number of courses in the system",
  labelNames: ["kind"],
});

export const usersTotal = new client.Gauge({
  name: "users_total",
  help: "Total number of users in the system",
  labelNames: ["subscription_kind"],
});

// Error Metrics
export const errorTotal = new client.Counter({
  name: "errors_total",
  help: "Total number of errors",
  labelNames: ["type", "endpoint"],
});

// Authentication Metrics
export const authenticationAttempts = new client.Counter({
  name: "authentication_attempts_total",
  help: "Total number of authentication attempts",
  labelNames: ["endpoint", "status"],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestsInProgress);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(dbQueryTotal);
register.registerMetric(userRegistrations);
register.registerMetric(userLogins);
register.registerMetric(subscriptionUpgrades);
register.registerMetric(courseLikes);
register.registerMetric(courseViews);
register.registerMetric(catalogViews);
register.registerMetric(activeUsers);
register.registerMetric(coursesTotal);
register.registerMetric(usersTotal);
register.registerMetric(errorTotal);
register.registerMetric(authenticationAttempts);

export { register };
