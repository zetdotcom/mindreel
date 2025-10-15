import { defineConfig, UserConfig } from "vite";
import path from "path";

/**
 * Capture Window Vite configuration.
 *
 * This configures the second renderer process (capture popup window).
 * Uses the same setup as main renderer but with a different entry point.
 */
export default defineConfig(async (): Promise<UserConfig> => {
  // Dynamically import the ESM-only React plugin
  const reactPlugin = (await import("@vitejs/plugin-react")).default;

  return {
    plugins: [
      reactPlugin({
        jsxImportSource: "react",
      }),
    ],
    // Explicit modern target (Electron 38 = Chrome 128)
    build: {
      target: "chrome128",
      sourcemap: true,
      rollupOptions: {
        input: path.resolve(__dirname, "src/capture.html"),
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      exclude: ["electron"],
    },
  };
});
