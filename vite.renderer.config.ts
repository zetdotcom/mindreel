import { defineConfig, UserConfig } from "vite";

/**
 * Renderer Vite configuration.
 *
 * This is written so that the ESM-only @vitejs/plugin-react is loaded via a dynamic import.
 * That avoids Electron Forge (or any CommonJS-based loader) attempting to `require()` the plugin
 * directly during its esbuild "externalize-deps" pass, which caused the previous error.
 *
 * Vite supports an async config function; we leverage that to `import()` the plugin at runtime.
 */
export default defineConfig(async (): Promise<UserConfig> => {
  // Dynamically import the ESM-only React plugin
  const reactPlugin = (await import("@vitejs/plugin-react")).default;

  return {
    plugins: [
      reactPlugin({
        jsxImportSource: "react",
        // You can customize Babel, fast refresh, etc. here if needed
      }),
    ],
    // Explicit modern target (Electron 38 = Chrome 128)
    build: {
      target: "chrome128",
      // (Optional) customize outDir or sourcemap if desired
      sourcemap: true,
    },
    resolve: {
      alias: {
        // Place renderer-side aliases here if you add them later
      },
    },
    optimizeDeps: {
      // Electron built-ins should NOT be pre-bundled; normally not needed, but explicit exclusions are safe.
      exclude: ["electron"],
    },
    server: {
      // You can enable strict port or specify a port if collisions occur
      // strictPort: true,
      // port: 5173,
    },
  };
});
