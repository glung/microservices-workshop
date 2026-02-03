import { Course, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../prisma";

/**
 * 📣 Le Repository gère l'accès aux données du domaine Course
 * Il abstrait la persistance pour le domaine métier
 */

export interface CourseWithLikes extends Course {
  like_count: string;
  is_liked?: boolean;
}

export class CourseRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || defaultPrisma;
  }

  /**
   * Récupère tous les cours avec le nombre de likes
   * @param userId - L'ID de l'utilisateur (optionnel) pour savoir s'il a liké
   * @returns La liste des cours avec like_count et is_liked
   */
  async findAllCourses(userId?: number): Promise<CourseWithLikes[]> {
    // 📜 Utilisation de Prisma pour récupérer les cours avec agrégation
    const courses = await this.prisma.course.findMany({
      include: {
        likes: userId
          ? {
              where: {
                user_id: userId,
              },
            }
          : true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return courses.map((course) => {
      const likeCount = Array.isArray(course.likes)
        ? course.likes.length.toString()
        : "0";
      const isLiked = userId
        ? course.likes.some((like) => like.user_id === userId)
        : undefined;

      return {
        ...course,
        like_count: likeCount,
        is_liked: isLiked,
      };
    });
  }

  /**
   * Récupère un cours par son ID
   * @param courseId - L'ID du cours
   * @returns Le cours ou null si non trouvé
   */
  async findCourseById(courseId: number): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: {
        id: courseId,
      },
    });
  }

  /**
   * Vérifie si un cours est liké par un utilisateur
   * @param courseId - L'ID du cours
   * @param userId - L'ID de l'utilisateur
   * @returns true si le cours est liké, false sinon
   */
  async isCourseLiked(courseId: number, userId: number): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    return like !== null;
  }

  /**
   * Ajoute un like à un cours
   * @param courseId - L'ID du cours
   * @param userId - L'ID de l'utilisateur
   */
  async addLike(courseId: number, userId: number): Promise<void> {
    // 📜 Utilisation de upsert pour éviter les doublons
    await this.prisma.like.upsert({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
      update: {},
      create: {
        user_id: userId,
        course_id: courseId,
      },
    });
  }

  /**
   * Retire un like d'un cours
   * @param courseId - L'ID du cours
   * @param userId - L'ID de l'utilisateur
   */
  async removeLike(courseId: number, userId: number): Promise<void> {
    await this.prisma.like.deleteMany({
      where: {
        user_id: userId,
        course_id: courseId,
      },
    });
  }
}
