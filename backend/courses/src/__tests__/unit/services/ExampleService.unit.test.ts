import { ExampleRepository } from "../../../repositories/ExampleRepository";
import { ExampleService } from "../../../services/ExampleService";

describe("ExampleService", () => {
  let service: ExampleService;
  let repository: jest.Mocked<ExampleRepository>;

  beforeEach(() => {
    repository = {
      listAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<ExampleRepository>;

    service = new ExampleService(repository);
  });

  // 🤓 Nous testons uniquement la logique métier

  it("should create example with trimmed name", async () => {
    repository.create.mockResolvedValue({
      id: 3,
      name: "Three",
      created_at: new Date(),
    });

    const result = await service.createExample("  Three  ");

    expect(result.name).toBe("Three");
    expect(repository.create).toHaveBeenCalledWith("Three");
  });

  it("should reject empty name", async () => {
    await expect(service.createExample(" ")).rejects.toThrow(
      "Name is required",
    );
  });
});
