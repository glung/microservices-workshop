import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

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

    // 📜 Utilisation du Service pour authentifier l'utilisateur
    // Le service gère la logique métier (vérification d'expiration d'abonnement)
    const user = await authService.authenticateUserById(userId);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;

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

    // 📣 Récupérer les données de l'utilisateur avec le Service
    const user = await authService.authenticateUserById(userId);

    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Invalid token, continue without user
  }

  next();
};

export { authenticate, optionalAuth };
