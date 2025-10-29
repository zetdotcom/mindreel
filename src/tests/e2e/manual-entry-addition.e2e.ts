import { expect, test } from "./fixtures/electronApp";

test.describe("Manual Entry Addition Flow", () => {
  test("should launch app and show history view", async ({ mainPage }) => {
    await mainPage.waitForLoadState("domcontentloaded");

    const addEntryButton = mainPage.getByTestId("add-entry-button");
    await expect(addEntryButton).toBeVisible({ timeout: 10000 });
  });
});
