import express, { Request, Response } from "express";
import { optionalAuth } from "../middleware/auth";
import { catalogViews, errorTotal } from "../monitoring/metrics";
import { CourseService } from "../services/CourseService";

const router = express.Router();
const courseService = new CourseService();

router.get(
  "/",
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      catalogViews.inc({ authenticated: req.user ? "true" : "false" });
      const courses = await courseService.listAllCourses(req.user?.id);
      res.json({ courses });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "catalog_error", endpoint: "/api/catalog" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

export default router;
