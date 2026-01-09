import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { metricsMiddleware } from "./middleware/metrics";
import { register } from "./monitoring/metrics";
// 👩‍🎓 Importer jsonwebtoken pour vérifier les tokens JWT
// 🤓 npm install jsonwebtoken @types/jsonwebtoken
// 📜 Documentation: https://github.com/auth0/node-jsonwebtoken
import jwt from "jsonwebtoken";

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const MONOLITH_URL = process.env.MONOLITH_URL;

app.use(metricsMiddleware);

app.get("/gateway/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "gateway",
    timestamp: new Date().toISOString()
  });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// 📣 Fonction helper pour classifier les routes selon leur besoin d'authentification
// 👩‍🎓 Cette fonction détermine si une route nécessite une authentification obligatoire, optionnelle, ou aucune
function getAuthLevel(path: string, method: string): 'none' | 'optional' | 'required' {
  // 📣 Routes publiques (pas d'authentification requise)
  if (path.startsWith('/api/auth/') ||
      path === '/health' ||
      path === '/metrics' ||
      path === '/gateway/health') {
    return 'none';
  }

  // 📣 Routes protégées (authentification obligatoire)
  if (path.startsWith('/api/accounts/')) return 'required';
  if (path.match(/^\/api\/courses\/\d+\/(like|unlock)$/) &&
      (method === 'POST' || method === 'DELETE')) {
    return 'required';
  }

  // 📣 Routes avec authentification optionnelle
  if (path === '/api/catalog') return 'optional';
  if (path.match(/^\/api\/courses\/\d+$/) && method === 'GET') return 'optional';

  return 'none';
}

// 👩‍🎓 EXERCICE : Implémenter le middleware d'authentification JWT
// 📣 Ce middleware s'exécute AVANT le proxy et valide les tokens JWT
// 📣 Objectif : décoder le JWT et transmettre l'ID utilisateur au monolithe via le header X-User-ID
app.use((req, res, next) => {
  const authLevel = getAuthLevel(req.path, req.method);

  // 📣 Pas d'authentification nécessaire pour les routes publiques
  if (authLevel === 'none') {
    return next();
  }

  // 👩‍🎓 ÉTAPE 1 : Extraire le token du header Authorization
  // 🤓 Le token est dans le format : "Bearer <token>"
  // 🤓 Utilisez authHeader?.replace('Bearer ', '') pour extraire le token
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  // 👩‍🎓 ÉTAPE 2 : Gérer l'absence de token
  if (!token) {
    if (authLevel === 'required') {
      // 🤓 Routes protégées : retourner 401 si pas de token
      return res.status(401).json({ error: 'Authentication required' });
    }
    // 📣 Routes optionnelles : continuer sans contexte utilisateur
    return next();
  }

  // 👩‍🎓 ÉTAPE 3 : Vérifier la validité du token JWT
  // 📣 Décoder le token avec jwt.verify() et transmettre l'userId au monolithe
  try {
    // 🤓 Récupérer le secret JWT depuis les variables d'environnement
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    // 👩‍🎓 TODO: Décoder et vérifier le token JWT
    // 🤓 Utilisez : jwt.verify(token, secret) as { userId: number }
    // 🤓 Cette fonction lance une exception si le token est invalide ou expiré
    // 💣 Complétez le code ci-dessous en décommentant et en complétant la ligne
    // const decoded = ...

    // 👩‍🎓 TODO: Ajouter le header X-User-ID pour transmettre l'identité au monolithe
    // 📣 Le monolithe est dans une "zone de confiance" et lira ce header
    // 📣 Il ne vérifiera PAS le JWT, il fera confiance à la gateway
    // 🤓 Ajoutez : req.headers['x-user-id'] = decoded.userId.toString();
    // 💣 Complétez le code ci-dessous en décommentant et en complétant la ligne
    // req.headers['x-user-id'] = ...

    next();
  } catch (err) {
    // 📣 Token invalide ou expiré
    if (authLevel === 'required') {
      // 🤓 Routes protégées : retourner 401
      return res.status(401).json({ error: 'Invalid token' });
    }
    // 📣 Routes optionnelles : continuer sans contexte utilisateur
    next();
  }
});

// 📣 Proxy toutes les requêtes vers le monolithe
app.use(
  "/",
  createProxyMiddleware({
    target: MONOLITH_URL,
    changeOrigin: true,
  })
);

app.listen(PORT, () => {
  console.log(`✅ Gateway running on port ${PORT}`);
});
