import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { PublisherGithub } from "@electron-forge/publisher-github";
import type { ForgeConfig } from "@electron-forge/shared-types";

const config: ForgeConfig = {
  packagerConfig: {
    icon: "./assets/icons/icon",
    asar: {
      unpack: "*.{node,dll}",
    },
    extraResource: [],
  },
  rebuildConfig: {},
  hooks: {
    packageAfterCopy: async (_config, buildPath, _electronVersion, platform, arch) => {
      const { execSync } = require("child_process");
      const fs = require("fs");
      const path = require("path");

      const packageJsonPath = path.join(buildPath, "package.json");
      if (!fs.existsSync(packageJsonPath)) {
        const minimalPackageJson = {
          name: "mindreel",
          version: "1.0.0",
          main: ".vite/build/main.js",
          dependencies: {
            sqlite3: "^5.1.7",
          },
        };
        fs.writeFileSync(packageJsonPath, JSON.stringify(minimalPackageJson, null, 2));
      }

      execSync("npm install --production --no-package-lock --loglevel=error", {
        cwd: buildPath,
        stdio: "pipe",
        env: { ...process.env, npm_config_build_from_source: "true" },
      });
    },
  },
  makers: [
    new MakerDMG(
      {
        name: "MindReel",
        background: undefined,
        icon: "./assets/icons/icon.icns",
      },
      ["darwin"],
    ),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
        {
          name: "capture_window",
          config: "vite.capture.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "zetdotcom",
        name: "mindreel",
      },
      prerelease: false,
      draft: true,
    }),
  ],
};

export default config;
