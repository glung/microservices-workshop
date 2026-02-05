interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  subscription_kind: "Free" | "Max";
  end_date: Date | null;
}

declare namespace Express {
  interface Request {
    user?: AuthenticatedUser;
  }
}
