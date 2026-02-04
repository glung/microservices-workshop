import { ExampleRepository } from "../repositories/ExampleRepository";

export class ExampleService {
  private exampleRepository: ExampleRepository;

  constructor(exampleRepository?: ExampleRepository) {
    this.exampleRepository = exampleRepository || new ExampleRepository();
  }

  async listExamples() {
    return this.exampleRepository.listAll();
  }

  async getExample(id: number) {
    return this.exampleRepository.findById(id);
  }

  async createExample(name: string) {
    if (!name || !name.trim()) {
      throw new Error("Name is required");
    }

    return this.exampleRepository.create(name.trim());
  }
}
