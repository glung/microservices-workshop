import express, { Request, Response } from "express";
import { UserService } from "../services/UserService";

const router = express.Router();
const userService = new UserService();

/**
 * POST /users/register
 * Enregistre un nouvel utilisateur
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, subscriptionKind } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      subscriptionKind?: "Free" | "Max";
    };

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password and name are required" });
      return;
    }

    const result = await userService.register({
      email,
      password,
      name,
      subscriptionKind,
    });

    res.status(201).json(result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const status = errorMessage === "Email already exists" ? 409 : 500;
    res.status(status).json({ error: errorMessage });
  }
});

/**
 * POST /users/login
 * Authentifie un utilisateur
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const result = await userService.login({ email, password });
    res.json(result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const status = errorMessage === "Invalid credentials" ? 401 : 500;
    res.status(status).json({ error: errorMessage });
  }
});

/**
 * GET /users
 * Liste tous les utilisateurs
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.listUsers();
    res.json({ users });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /users/:id
 * Récupère un utilisateur par son ID
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const user = await userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /users/:id/upgrade
 * Met à jour l'abonnement d'un utilisateur vers Max
 */
router.post("/:id/upgrade", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const user = await userService.upgradeToMax(id);
    res.json({ user });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const status = errorMessage === "User not found" ? 404 : 500;
    res.status(status).json({ error: errorMessage });
  }
});

/**
 * POST /users/verify
 * Vérifie un token JWT et retourne les informations de l'utilisateur
 */
router.post("/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body as { token?: string };

    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    const user = await userService.verifyToken(token);
    if (!user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    res.json({ user });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
