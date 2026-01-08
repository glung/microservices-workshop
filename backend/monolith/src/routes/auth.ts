import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { User, SubscriptionKind, UserWithSubscription } from '../types/models';
import { userRegistrations, userLogins, authenticationAttempts, errorTotal } from '../monitoring/metrics';

const router = express.Router();

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
router.post('/register', async (req: Request<object, object, RegisterBody>, res: Response): Promise<void> => {
  try {
    const { email, password, name, subscriptionKind = 'Free' } = req.body;

    authenticationAttempts.inc({ endpoint: 'register', status: 'attempted' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query('BEGIN');

    const userResult = await pool.query<User>(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    const user = userResult.rows[0];

    const endDate = subscriptionKind === 'Max'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : null;

    await pool.query(
      'INSERT INTO subscriptions (user_id, kind, end_date) VALUES ($1, $2, $3)',
      [user.id, subscriptionKind, endDate]
    );

    await pool.query('COMMIT');

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign({ userId: user.id }, secret);

    userRegistrations.inc({ subscription_kind: subscriptionKind });
    authenticationAttempts.inc({ endpoint: 'register', status: 'success' });

    res.json({
      user: { ...user, subscription_kind: subscriptionKind },
      token
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    authenticationAttempts.inc({ endpoint: 'register', status: 'failed' });
    errorTotal.inc({ type: 'registration_error', endpoint: '/api/auth/register' });
    res.status(400).json({ error: errorMessage });
  }
});

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
router.post('/login', async (req: Request<object, object, LoginBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    authenticationAttempts.inc({ endpoint: 'login', status: 'attempted' });

    const result = await pool.query<UserWithSubscription>(
      `SELECT u.*, s.kind as subscription_kind
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.active = true
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      authenticationAttempts.inc({ endpoint: 'login', status: 'failed' });
      userLogins.inc({ status: 'failed' });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      authenticationAttempts.inc({ endpoint: 'login', status: 'failed' });
      userLogins.inc({ status: 'failed' });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign({ userId: user.id }, secret);

    authenticationAttempts.inc({ endpoint: 'login', status: 'success' });
    userLogins.inc({ status: 'success' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_kind: user.subscription_kind || 'Free'
      },
      token
    });
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    errorTotal.inc({ type: 'login_error', endpoint: '/api/auth/login' });
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
