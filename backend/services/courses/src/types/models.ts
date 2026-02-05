export type SubscriptionKind = "Free" | "Max";

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: Date;
}

export interface Course {
  id: number;
  name: string;
  author: string;
  content: string;
  kind: SubscriptionKind;
  created_at: Date;
}
