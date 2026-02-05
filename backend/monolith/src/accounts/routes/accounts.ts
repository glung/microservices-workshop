import express, { Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import { subscriptionUpgrades, errorTotal } from "../../monitoring/metrics";
import { AccountService } from "../services/AccountService";

const router = express.Router();
const accountService = new AccountService();

/**
 * @swagger
 * /api/accounts/me:
 *   get:
 *     summary: Get account information
 *     description: Retrieve the authenticated user's account details and subscription information
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     kind:
 *                       type: string
 *                       enum: [Free, Max]
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized - authentication required
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
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // 📣 Utilisation du Service qui contient la logique métier
      const accountInfo = accountService.getAccountInfo(req.user);

      res.json(accountInfo);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "account_info_error", endpoint: "/api/accounts/me" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

/**
 * @swagger
 * /api/accounts/likes:
 *   get:
 *     summary: Get liked courses
 *     description: Retrieve all courses liked by the authenticated user
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liked courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked_courses:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Course'
 *                       - type: object
 *                         properties:
 *                           liked_at:
 *                             type: string
 *                             format: date-time
 *                             description: Timestamp when the course was liked
 *       401:
 *         description: Unauthorized - authentication required
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
router.get(
  "/likes",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // 📣 Utilisation du Service pour récupérer les cours likés
      const likedCourses = await accountService.getLikedCourses(req.user.id);

      res.json({ liked_courses: likedCourses });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "likes_fetch_error", endpoint: "/api/accounts/likes" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

/**
 * @swagger
 * /api/accounts/upgrade:
 *   post:
 *     summary: Upgrade subscription
 *     description: Upgrade the authenticated user's subscription from Free to Max (30 days)
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription upgraded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     kind:
 *                       type: string
 *                       example: Max
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Already have Max subscription
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
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
  "/upgrade",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // 📣 Utilisation du Service qui contient la logique métier
      const subscription = await accountService.upgradeSubscription(
        req.user.id,
        req.user.subscription_kind,
      );

      // 🤖 Monitoring
      subscriptionUpgrades.inc();

      res.json({
        success: true,
        subscription,
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      // 🤓 Gestion spécifique de l'erreur "Already have Max"
      if (errorMessage === "Already have Max subscription") {
        res.status(400).json({ error: errorMessage });
      } else {
        errorTotal.inc({ type: "upgrade_error", endpoint: "/api/accounts/upgrade" });
        res.status(500).json({ error: errorMessage });
      }
    }
  },
);

export default router;
