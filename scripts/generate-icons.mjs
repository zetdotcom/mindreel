import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "assets");
const sourcePath = path.join(assetsDir, "icon-source.svg");
const pngPath = path.join(assetsDir, "icon.png");
const icnsPath = path.join(assetsDir, "icon.icns");
const iconsetEntries = [
  ["icon_16x16.png", 16],
  ["icon_16x16@2x.png", 32],
  ["icon_32x32.png", 32],
  ["icon_32x32@2x.png", 64],
  ["icon_128x128.png", 128],
  ["icon_128x128@2x.png", 256],
  ["icon_256x256.png", 256],
  ["icon_256x256@2x.png", 512],
  ["icon_512x512.png", 512],
  ["icon_512x512@2x.png", 1024],
];

const browserCandidates = [
  chromium.executablePath(),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];

if (process.platform !== "darwin") {
  throw new Error(
    "Icon generation currently supports macOS only because it relies on sips and iconutil.",
  );
}

const browserExecutable = browserCandidates.find((candidate) => existsSync(candidate));

if (!browserExecutable) {
  throw new Error("Could not find a Chromium-based browser to render the icon source.");
}

const svg = await readFile(sourcePath, "utf8");
const browser = await chromium.launch({
  executablePath: browserExecutable,
  headless: true,
});

try {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { width: 1024, height: 1024 },
  });

  await page.setContent(
    `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <style>
            html, body {
              margin: 0;
              width: 100%;
              height: 100%;
              background: transparent;
            }

            body {
              display: grid;
              place-items: center;
            }

            svg {
              display: block;
              width: 1024px;
              height: 1024px;
            }
          </style>
        </head>
        <body>${svg}</body>
      </html>
    `,
    { waitUntil: "load" },
  );

  await page.screenshot({
    clip: { x: 0, y: 0, width: 1024, height: 1024 },
    omitBackground: true,
    path: pngPath,
  });
} finally {
  await browser.close();
}

const iconsetDir = path.join(os.tmpdir(), `mindreel-icon-${Date.now()}.iconset`);
await mkdir(iconsetDir, { recursive: true });

try {
  for (const [filename, size] of iconsetEntries) {
    execFileSync(
      "sips",
      ["-z", String(size), String(size), pngPath, "--out", path.join(iconsetDir, filename)],
      {
        stdio: "pipe",
      },
    );
  }

  execFileSync("iconutil", ["-c", "icns", iconsetDir, "-o", icnsPath], {
    stdio: "pipe",
  });
} finally {
  await rm(iconsetDir, { force: true, recursive: true });
}
