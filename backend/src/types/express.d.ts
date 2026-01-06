import { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  subscription_kind: 'Free' | 'Max';
  end_date: Date | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
