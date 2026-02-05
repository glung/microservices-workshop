import { Course } from "@prisma/client";
import {
  CourseRepository,
  CourseWithLikes,
} from "../repositories/CourseRepository";

export type SubscriptionKind = "Free" | "Max";

export interface CourseWithAccess extends Omit<Course, "content"> {
  content?: string;
  requires_subscription?: boolean;
}

export class CourseService {
  private courseRepository: CourseRepository;

  constructor(courseRepository?: CourseRepository) {
    this.courseRepository = courseRepository || new CourseRepository();
  }

  async listAllCourses(userId?: number): Promise<CourseWithLikes[]> {
    return this.courseRepository.findAllCourses(userId);
  }

  async getCourseById(
    courseId: number,
    subscriptionKind?: SubscriptionKind,
  ): Promise<CourseWithAccess | null> {
    const course = await this.courseRepository.findCourseById(courseId);

    if (!course) {
      return null;
    }

    const canAccessContent =
      course.kind === "Free" || subscriptionKind === "Max";

    const courseWithAccess: CourseWithAccess = {
      id: course.id,
      name: course.name,
      author: course.author,
      kind: course.kind,
      created_at: course.created_at,
    };

    if (canAccessContent) {
      courseWithAccess.content = course.content;
    } else {
      courseWithAccess.requires_subscription = true;
    }

    return courseWithAccess;
  }

  async likeCourse(courseId: number, userId: number): Promise<void> {
    await this.courseRepository.addLike(courseId, userId);
  }

  async unlikeCourse(courseId: number, userId: number): Promise<void> {
    await this.courseRepository.removeLike(courseId, userId);
  }
}
