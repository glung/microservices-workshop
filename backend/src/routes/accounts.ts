import express, { Request, Response } from 'express';
import { pool } from '../db';
import { authenticate } from '../middleware/auth';
import { CourseWithLikedAt } from '../types/models';
import { subscriptionUpgrades, errorTotal } from '../monitoring/metrics';

const router = express.Router();

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
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const accountInfo = {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      subscription: {
        kind: req.user.subscription_kind || 'Free',
        end_date: req.user.end_date
      }
    };

    res.json(accountInfo);
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    errorTotal.inc({ type: 'account_info_error', endpoint: '/api/accounts/me' });
    res.status(500).json({ error: errorMessage });
  }
});

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
router.get('/likes', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await pool.query<CourseWithLikedAt>(`
      SELECT c.*, l.created_at as liked_at
      FROM likes l
      JOIN courses c ON l.course_id = c.id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC
    `, [req.user.id]);

    res.json({ liked_courses: result.rows });
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    errorTotal.inc({ type: 'likes_fetch_error', endpoint: '/api/accounts/likes' });
    res.status(500).json({ error: errorMessage });
  }
});

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
router.post('/upgrade', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.subscription_kind === 'Max') {
      res.status(400).json({ error: 'Already have Max subscription' });
      return;
    }

    await pool.query('BEGIN');

    await pool.query(
      'UPDATE subscriptions SET active = false WHERE user_id = $1',
      [req.user.id]
    );

    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO subscriptions (user_id, kind, end_date) VALUES ($1, $2, $3)',
      [req.user.id, 'Max', endDate]
    );

    await pool.query('COMMIT');

    subscriptionUpgrades.inc();

    res.json({
      success: true,
      subscription: {
        kind: 'Max',
        end_date: endDate
      }
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    errorTotal.inc({ type: 'upgrade_error', endpoint: '/api/accounts/upgrade' });
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
