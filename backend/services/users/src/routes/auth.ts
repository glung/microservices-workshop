import express, { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { SubscriptionKind } from "@prisma/client";

const router = express.Router();
const authService = new AuthService();

interface RegisterBody {
  email: string;
  password: string;
  name: string;
  subscriptionKind?: SubscriptionKind;
}

interface LoginBody {
  email: string;
  password: string;
}

router.post(
  "/register",
  async (req: Request<object, object, RegisterBody>, res: Response): Promise<void> => {
    try {
      const { email, password, name, subscriptionKind = "Free" } = req.body;
      const result = await authService.register({
        email,
        password,
        name,
        subscriptionKind,
      });
      res.json(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: errorMessage });
    }
  },
);

router.post(
  "/login",
  async (req: Request<object, object, LoginBody>, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (errorMessage === "Invalid credentials") {
        res.status(401).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: errorMessage });
    }
  },
);

export default router;
