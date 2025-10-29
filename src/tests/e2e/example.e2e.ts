import { expect, test } from "@playwright/test";

test.describe("Example E2E Test", () => {
  test("basic test example", async () => {
    expect(1 + 1).toBe(2);
  });

  test("playwright assertions work", async () => {
    const title = "MindReel Test";
    expect(title).toBe("MindReel Test");
  });

  test("string matchers work", async () => {
    const appName = "MindReel";
    expect(appName).toContain("Mind");
    expect(appName).toHaveLength(8);
  });

  test("array operations work", async () => {
    const features = ["capture", "history", "summaries"];
    expect(features).toHaveLength(3);
    expect(features).toContain("capture");
  });
});
