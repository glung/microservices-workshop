import express, { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { subscriptionUpgrades, errorTotal } from "../monitoring/metrics";
import { AccountService } from "../services/AccountService";

const router = express.Router();
const accountService = new AccountService();

router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const accountInfo = accountService.getAccountInfo(req.user);
      res.json(accountInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "account_info_error", endpoint: "/api/accounts/me" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

router.get(
  "/likes",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const likedCourses = await accountService.getLikedCourses(req.user.id);
      res.json({ liked_courses: likedCourses });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "likes_fetch_error", endpoint: "/api/accounts/likes" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

router.post(
  "/upgrade",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const subscription = await accountService.upgradeSubscription(
        req.user.id,
        req.user.subscription_kind,
      );

      subscriptionUpgrades.inc();

      res.json({
        success: true,
        subscription,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (errorMessage === "Already have Max subscription") {
        res.status(400).json({ error: errorMessage });
        return;
      }

      errorTotal.inc({ type: "upgrade_error", endpoint: "/api/accounts/upgrade" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

export default router;
