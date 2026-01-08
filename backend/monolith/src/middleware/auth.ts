import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { UserWithSubscription } from '../types/models';

const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 👩‍🎓 Lire l'ID utilisateur depuis le header X-User-ID fourni par la gateway
    // 📣 La gateway a déjà vérifié le JWT et nous transmet l'identité de l'utilisateur
    const userIdHeader = req.headers['x-user-id'];

    if (!userIdHeader || typeof userIdHeader !== 'string') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // 🤓 Convertir le header en nombre
    const userId = parseInt(userIdHeader, 10);
    if (isNaN(userId)) {
      res.status(401).json({ error: 'Invalid user ID' });
      return;
    }

    // 📣 Récupérer les données complètes de l'utilisateur depuis la base de données
    const result = await pool.query<UserWithSubscription>(`
      SELECT u.*, s.kind as subscription_kind, s.end_date
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.active = true
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];

    if (user.subscription_kind === 'Max' && user.end_date && new Date(user.end_date) < new Date()) {
      await pool.query(`
        UPDATE subscriptions
        SET active = false
        WHERE user_id = $1 AND active = true
      `, [user.id]);
      user.subscription_kind = 'Free';
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_kind: user.subscription_kind || 'Free',
      end_date: user.end_date || null
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // 👩‍🎓 Lire l'ID utilisateur depuis le header X-User-ID (si présent)
    // 📣 Pour l'authentification optionnelle, l'absence du header signifie que l'utilisateur n'est pas authentifié
    const userIdHeader = req.headers['x-user-id'];

    if (!userIdHeader || typeof userIdHeader !== 'string') {
      // 📣 Pas de header X-User-ID : continuer sans contexte utilisateur
      next();
      return;
    }

    // 🤓 Convertir le header en nombre
    const userId = parseInt(userIdHeader, 10);
    if (isNaN(userId)) {
      // 📣 Header invalide : continuer sans contexte utilisateur
      next();
      return;
    }

    // 📣 Récupérer les données de l'utilisateur depuis la base de données
    const result = await pool.query<UserWithSubscription>(`
      SELECT u.*, s.kind as subscription_kind, s.end_date
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.active = true
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_kind: user.subscription_kind || 'Free',
        end_date: user.end_date || null
      };
    }
  } catch (err) {
    // Invalid token, continue without user
  }

  next();
};

export { authenticate, optionalAuth };
