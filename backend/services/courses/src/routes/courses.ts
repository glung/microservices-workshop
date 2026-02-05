import express, { Request, Response } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { courseViews, courseLikes, errorTotal } from "../monitoring/metrics";
import { CourseService } from "../services/CourseService";

const router = express.Router();
const courseService = new CourseService();

router.get(
  "/:id",
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const courseId = parseInt(id, 10);

      if (Number.isNaN(courseId)) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }

      const course = await courseService.getCourseById(
        courseId,
        req.user?.subscription_kind,
      );

      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      const canAccessContent = course.content !== undefined;
      courseViews.inc({
        course_kind: course.kind,
        access_granted: canAccessContent ? "true" : "false",
      });

      res.json({ course });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "course_view_error", endpoint: "/api/courses/:id" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

router.post(
  "/:id/like",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const courseId = parseInt(id, 10);

      if (Number.isNaN(courseId)) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      await courseService.likeCourse(courseId, req.user.id);
      courseLikes.inc({ action: "like" });
      res.json({ success: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "like_error", endpoint: "/api/courses/:id/like" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

router.delete(
  "/:id/like",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const courseId = parseInt(id, 10);

      if (Number.isNaN(courseId)) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      await courseService.unlikeCourse(courseId, req.user.id);
      courseLikes.inc({ action: "unlike" });
      res.json({ success: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "unlike_error", endpoint: "/api/courses/:id/like" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

export default router;
