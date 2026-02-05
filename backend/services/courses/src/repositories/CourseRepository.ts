import { Course, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

export interface CourseWithLikes extends Course {
  like_count: string;
  is_liked?: boolean;
}

export class CourseRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || defaultPrisma;
  }

  async findAllCourses(userId?: number): Promise<CourseWithLikes[]> {
    const courses = await this.prisma.course.findMany({
      include: {
        likes: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return courses.map((course) => {
      const { likes, ...courseData } = course;
      const likeCount = Array.isArray(course.likes)
        ? course.likes.length.toString()
        : "0";

      if (userId) {
        const isLiked = likes.some((like) => like.user_id === userId);
        return {
          ...courseData,
          like_count: likeCount,
          is_liked: isLiked,
        };
      }

      return {
        ...courseData,
        like_count: likeCount,
      };
    });
  }

  async findCourseById(courseId: number): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: {
        id: courseId,
      },
    });
  }

  async addLike(courseId: number, userId: number): Promise<void> {
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

  async removeLike(courseId: number, userId: number): Promise<void> {
    await this.prisma.like.deleteMany({
      where: {
        user_id: userId,
        course_id: courseId,
      },
    });
  }
}
