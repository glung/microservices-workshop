import { CourseService } from "../../../services/CourseService";
import { CourseRepository } from "../../../repositories/CourseRepository";

describe("CourseService", () => {
  it("returns content for free courses", async () => {
    const repo = {
      findCourseById: jest.fn().mockResolvedValue({
        id: 1,
        name: "Free",
        author: "A",
        content: "Content",
        kind: "Free",
        created_at: new Date(),
      }),
    } as unknown as CourseRepository;

    const service = new CourseService(repo);
    const result = await service.getCourseById(1, "Free");

    expect(result?.content).toBe("Content");
    expect(result?.requires_subscription).toBeUndefined();
  });

  it("hides max content for free subscription", async () => {
    const repo = {
      findCourseById: jest.fn().mockResolvedValue({
        id: 2,
        name: "Max",
        author: "B",
        content: "Premium",
        kind: "Max",
        created_at: new Date(),
      }),
    } as unknown as CourseRepository;

    const service = new CourseService(repo);
    const result = await service.getCourseById(2, "Free");

    expect(result?.content).toBeUndefined();
    expect(result?.requires_subscription).toBe(true);
  });

  it("shows max content for max subscription", async () => {
    const repo = {
      findCourseById: jest.fn().mockResolvedValue({
        id: 3,
        name: "Max",
        author: "C",
        content: "Premium",
        kind: "Max",
        created_at: new Date(),
      }),
    } as unknown as CourseRepository;

    const service = new CourseService(repo);
    const result = await service.getCourseById(3, "Max");

    expect(result?.content).toBe("Premium");
    expect(result?.requires_subscription).toBeUndefined();
  });
});
