import express, { Request, Response } from 'express';
import { pool } from '../db';
import { optionalAuth } from '../auth/middleware/auth';
import { CourseWithLikes } from '../types/models';
import { catalogViews, errorTotal } from '../monitoring/metrics';

const router = express.Router();

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
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    catalogViews.inc({ authenticated: req.user ? 'true' : 'false' });

    let query = `
      SELECT
        c.id,
        c.name,
        c.author,
        c.kind,
        c.created_at,
        COUNT(l.id) as like_count
    `;

    if (req.user) {
      query += `,
        EXISTS(
          SELECT 1 FROM likes
          WHERE course_id = c.id AND user_id = $1
        ) as is_liked
      `;
    }

    query += `
      FROM courses c
      LEFT JOIN likes l ON c.id = l.course_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query<CourseWithLikes>(
      query,
      req.user ? [req.user.id] : []
    );

    res.json({ courses: result.rows });
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    errorTotal.inc({ type: 'catalog_error', endpoint: '/api/catalog' });
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
