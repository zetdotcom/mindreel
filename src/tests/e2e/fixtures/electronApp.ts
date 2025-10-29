import path from "node:path";
import { _electron, test as base, type ElectronApplication, type Page } from "@playwright/test";
import { TestDatabase } from "../../fixtures/testDatabase";

type ElectronFixtures = {
  electronApp: ElectronApplication;
  mainPage: Page;
  testDb: TestDatabase;
};

export const test = base.extend<ElectronFixtures>({
  testDb: async ({}, use) => {
    const testDb = new TestDatabase();
    await testDb.setup();
    await use(testDb);
    await testDb.cleanup();
  },

  electronApp: async ({ testDb }, use) => {
    const userDataDir = path.dirname(testDb.getPath());

    const electronApp = await _electron.launch({
      args: [path.join(__dirname, "../../../.."), `--user-data-dir=${userDataDir}`],
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
      executablePath: require("electron"),
      timeout: 30000,
    });

    await use(electronApp);
    await electronApp.close();
  },

  mainPage: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await use(page);
  },
});

export { expect } from "@playwright/test";
