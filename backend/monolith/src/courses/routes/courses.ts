import express, { Request, Response } from "express";
import { authenticate, optionalAuth } from "../../middleware/auth";
import { courseViews, courseLikes, errorTotal } from "../../monitoring/metrics";
import { CourseService } from "../services/CourseService";

const router = express.Router();
const courseService = new CourseService();

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course details
 *     description: Retrieve detailed information about a specific course. Course content is only available for free courses or to users with Max subscription.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 course:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Course'
 *                     - type: object
 *                       properties:
 *                         requires_subscription:
 *                           type: boolean
 *                           description: Indicates if subscription is required to access content
 *       404:
 *         description: Course not found
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
  "/:id",
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const courseId = parseInt(id, 10);

      // 📣 Utilisation du Service qui contient la logique métier
      const course = await courseService.getCourseById(
        courseId,
        req.user?.subscription_kind,
      );

      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      // 🤖 Monitoring
      const canAccessContent = course.content !== undefined;
      courseViews.inc({
        course_kind: course.kind,
        access_granted: canAccessContent ? "true" : "false",
      });

      res.json({ course });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "course_view_error", endpoint: "/api/courses/:id" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

/**
 * @swagger
 * /api/courses/{id}/like:
 *   post:
 *     summary: Like a course
 *     description: Add a like to a specific course (requires authentication)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
  "/:id/like",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const courseId = parseInt(id, 10);

      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // 📣 Utilisation du Service pour liker un cours
      await courseService.likeCourse(courseId, req.user.id);

      // 🤖 Monitoring
      courseLikes.inc({ action: "like" });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "like_error", endpoint: "/api/courses/:id/like" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

/**
 * @swagger
 * /api/courses/{id}/like:
 *   delete:
 *     summary: Unlike a course
 *     description: Remove a like from a specific course (requires authentication)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
router.delete(
  "/:id/like",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const courseId = parseInt(id, 10);

      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // 📣 Utilisation du Service pour unliker un cours
      await courseService.unlikeCourse(courseId, req.user.id);

      // 🤖 Monitoring
      courseLikes.inc({ action: "unlike" });

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "unlike_error", endpoint: "/api/courses/:id/like" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

export default router;
