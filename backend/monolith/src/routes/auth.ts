import express, { Request, Response } from "express";
import {
  authenticationAttempts,
  errorTotal,
  userLogins,
  userRegistrations,
} from "../monitoring/metrics";
import { AuthService } from "../services/AuthService";
import { SubscriptionKind } from "../types/models";

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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email, password, and subscription type
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               subscriptionKind:
 *                 type: string
 *                 enum: [Free, Max]
 *                 default: Free
 *                 example: Free
 *     responses:
 *       200:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *       400:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/register",
  async (
    req: Request<object, object, RegisterBody>,
    res: Response,
  ): Promise<void> => {
    try {
      // 🤖 Monitoring
      authenticationAttempts.inc({ endpoint: "register", status: "attempted" });

      // 📣 Utilisation du Service qui contient la logique métier
      const { email, password, name, subscriptionKind = "Free" } = req.body;
      const result = await authService.register({
        email,
        password,
        name,
        subscriptionKind,
      });

      // 🤖 Monitoring
      userRegistrations.inc({ subscription_kind: subscriptionKind });
      authenticationAttempts.inc({ endpoint: "register", status: "success" });

      // 📣 Presentation
      res.json(result);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      authenticationAttempts.inc({ endpoint: "register", status: "failed" });
      errorTotal.inc({
        type: "registration_error",
        endpoint: "/api/auth/register",
      });
      res.status(400).json({ error: errorMessage });
    }
  },
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate a user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/login",
  async (
    req: Request<object, object, LoginBody>,
    res: Response,
  ): Promise<void> => {
    try {
      // 🤖 Monitoring
      authenticationAttempts.inc({ endpoint: "login", status: "attempted" });

      // 📣 Utilisation du Service qui contient la logique métier
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      // 🤖 Monitoring
      authenticationAttempts.inc({ endpoint: "login", status: "success" });
      userLogins.inc({ status: "success" });

      // 📣 Presentation
      res.json(result);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      // 🤓 Les erreurs d'authentification sont gérées différemment
      if (errorMessage === "Invalid credentials") {
        // 🤖 Monitoring
        authenticationAttempts.inc({ endpoint: "login", status: "failed" });
        userLogins.inc({ status: "failed" });

        // 📣 Presentation
        res.status(401).json({ error: errorMessage });
      } else {
        // 🤖 Monitoring
        errorTotal.inc({ type: "login_error", endpoint: "/api/auth/login" });

        // 📣 Presentation
        res.status(500).json({ error: errorMessage });
      }
    }
  },
);

export default router;
