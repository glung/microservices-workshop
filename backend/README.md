# Course Platform Monolith

## Service Responsibility

This service is a monolithic REST API for a course platform that provides:

- **Authentication & Authorization**: User registration, login, and JWT-based authentication
- **Course Catalog**: Browse and view available courses
- **Course Interactions**: Like/unlike courses
- **User Subscriptions**: Support for Free and Max subscription tiers
- **Health Monitoring**: Built-in health check endpoint and Prometheus metrics

The service is designed for workshop demonstrations on microservices, observability, and load testing.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Ports 3000 (API), 3001 (Grafana), 5432 (PostgreSQL), and 9090 (Prometheus) available

### Starting the Service

Start all services (API, PostgreSQL, Prometheus, Grafana):

```bash
cd backend
docker compose up
```

The services will be available at:

- **API**: http://localhost:3000
- **Grafana Dashboard**: http://localhost:3001
- **Prometheus**: http://localhost:9090

### Stopping the Service

```bash
docker compose down
```

To remove all data volumes:

```bash
docker compose down -v
```

## API Documentation

### Swagger/OpenAPI Documentation

Interactive API documentation is available at:

**http://localhost:3000/api-docs**

## Monitoring

### Grafana Dashboard

Access the Course Platform monitoring dashboard at:

**http://localhost:3001**

### Prometheus Metrics

Raw metrics are available at:

- **Prometheus UI**: http://localhost:9090

## Resource Limits

The service is configured with resource constraints for workshop demonstrations:

**Application Container:**

- CPU: 1.0 core limit, 0.5 core reservation
- Memory: 512MB limit, 256MB reservation

**Database Container:**

- CPU: 1.0 core limit, 0.25 core reservation
- Memory: 512MB limit, 128MB reservation

## Load Testing

See the `traffic_simulator/` directory for the Apache Bench-based traffic simulator:

```bash
cd traffic_simulator
npm install
npm start -- --load low   # 1000 requests
npm start -- --load high  # 5000 requests
```
