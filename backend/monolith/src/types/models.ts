export type SubscriptionKind = "Free" | "Max";

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: Date;
}

export interface Subscription {
  id: number;
  user_id: number;
  kind: SubscriptionKind;
  start_date: Date;
  end_date: Date | null;
  active: boolean;
}

export interface Course {
  id: number;
  name: string;
  author: string;
  content: string;
  kind: SubscriptionKind;
  created_at: Date;
}

export interface Like {
  id: number;
  user_id: number;
  course_id: number;
  created_at: Date;
}

export interface CourseWithLikes extends Course {
  like_count: number;
  is_liked?: boolean;
}

export interface CourseWithLikedAt extends Course {
  liked_at: Date;
}

export interface JwtPayload {
  userId: number;
}
