import {
  CourseRepository,
  CourseWithLikes,
} from "../repositories/CourseRepository";
import { SubscriptionKind } from "../../types/models";
import { Course } from "@prisma/client";

/**
 * Le Service contient la logique métier du domaine Course
 * Il orchestre le repository et implémente les règles métier
 */

export interface CourseWithAccess extends Omit<Course, "content"> {
  content?: string;
  requires_subscription?: boolean;
}

export class CourseService {
  private courseRepository: CourseRepository;

  constructor(courseRepository?: CourseRepository) {
    this.courseRepository = courseRepository || new CourseRepository();
  }

  /**
   * Liste tous les cours du catalogue
   * @param userId - L'ID de l'utilisateur (optionnel)
   * @returns La liste des cours avec like_count et is_liked
   */
  async listAllCourses(userId?: number): Promise<CourseWithLikes[]> {
    return this.courseRepository.findAllCourses(userId);
  }

  /**
   * Récupère un cours par son ID avec gestion de l'accès au contenu
   * 🤓 Règle métier: Les cours Free sont accessibles par tous
   * 🤓 Règle métier: Les cours Max nécessitent un abonnement Max
   *
   * @param courseId - L'ID du cours
   * @param subscriptionKind - Le type d'abonnement de l'utilisateur
   * @returns Le cours avec ou sans contenu selon l'accès
   */
  async getCourseById(
    courseId: number,
    subscriptionKind?: SubscriptionKind,
  ): Promise<CourseWithAccess | null> {
    const course = await this.courseRepository.findCourseById(courseId);

    if (!course) {
      return null;
    }

    // 🤓 Règle métier: Déterminer l'accès au contenu
    let canAccessContent = false;
    if (course.kind === "Free") {
      canAccessContent = true;
    } else if (subscriptionKind === "Max") {
      canAccessContent = true;
    }

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

  /**
   * Ajoute un like à un cours
   * @param courseId - L'ID du cours
   * @param userId - L'ID de l'utilisateur
   */
  async likeCourse(courseId: number, userId: number): Promise<void> {
    await this.courseRepository.addLike(courseId, userId);
  }

  /**
   * Retire un like d'un cours
   * @param courseId - L'ID du cours
   * @param userId - L'ID de l'utilisateur
   */
  async unlikeCourse(courseId: number, userId: number): Promise<void> {
    await this.courseRepository.removeLike(courseId, userId);
  }
}
