import express, { Request, Response } from "express";
import { optionalAuth } from "../../auth/middleware/auth";
import { catalogViews, errorTotal } from "../../monitoring/metrics";
import { CourseService } from "../services/CourseService";

const router = express.Router();
const courseService = new CourseService();

/**
 * @swagger
 * /api/catalog:
 *   get:
 *     summary: Get all courses
 *     description: Retrieve a list of all courses with like counts. Authentication is optional - if authenticated, includes whether the user has liked each course.
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Course'
 *                       - type: object
 *                         properties:
 *                           like_count:
 *                             type: integer
 *                             description: Number of likes for this course
 *                           is_liked:
 *                             type: boolean
 *                             description: Whether the authenticated user has liked this course (only included if authenticated)
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 🤖 Monitoring
      catalogViews.inc({ authenticated: req.user ? "true" : "false" });

      // 📣 Utilisation du Service pour récupérer le catalogue
      const courses = await courseService.listAllCourses(req.user?.id);

      res.json({ courses });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errorTotal.inc({ type: "catalog_error", endpoint: "/api/catalog" });
      res.status(500).json({ error: errorMessage });
    }
  },
);

export default router;
