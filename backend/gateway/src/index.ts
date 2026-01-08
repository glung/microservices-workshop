import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { metricsMiddleware } from "./middleware/metrics";
import { register } from "./monitoring/metrics";

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const MONOLITH_URL = process.env.MONOLITH_URL;

app.use(metricsMiddleware);

// 👩‍🎓 Implémenter un endpoint de health check pour le service gateway
app.get("/gateway/health", (req, res) => {
  // 🤓 Sans le healthpoint le service sera considéder commme "unhealthy"
  // 🤓 Dans le terminal `docker compose ps` vous indique que le service est "unhealthy"
  // NAME                    IMAGE                    STATUS
  // backend-gateway-1       backend-gateway          Up 3 minutes (unhealthy)

  // 👩‍🎓 Implémenter le endpoint pour qu'il retourne un status 200 avec un JSON indiquant
  // que le service est healthy. Prenez exemple sur le service monolith dans backend/monolith/src/index.ts

  // 💣 Ce code sera a changer
  res.status(500).json({ status: "unhealthy" });

  // 🤓 Use fois implémenté, `docker compose ps` doit vous indiquer que le service est "healthy"
  // NAME                    IMAGE                    STATUS
  // backend-gateway-1       backend-gateway          Up 3 minutes (healthy)
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// 📣 La gateway fait suivre toutes les requêtes vers le monolithe
app.use(
  "/",
  createProxyMiddleware({
    // 👩‍🎓 Configurer correctement
    target: "htttp://bad_url", // 💣 A changer par l'url du service monolith
    changeOrigin: true,
  })
);

app.listen(PORT, () => {
  console.log(`✅ Gateway running on port ${PORT}`);
});
