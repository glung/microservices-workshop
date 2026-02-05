import { AccountService } from "../../../services/AccountService";

describe("AccountService", () => {
  it("throws when upgrading Max subscription", async () => {
    const service = new AccountService({
      getLikedCourses: async () => [],
      upgradeSubscription: async () => undefined,
    } as any);

    await expect(service.upgradeSubscription(1, "Max")).rejects.toThrow(
      "Already have Max subscription",
    );
  });
});
