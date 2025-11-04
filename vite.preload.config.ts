import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        // Mark sqlite3 as external so it's not bundled
        "sqlite3",
        // Also exclude other native modules that might cause issues
        "electron",
        "fs",
        "path",
        "os",
      ],
      output: {
        format: "cjs",
      },
    },
    // Ensure we're targeting Node.js environment
    target: "node18",
    // Don't minify to preserve module structure for native dependencies
    minify: false,
  },
  // Configure how Vite handles dependencies
  ssr: {
    // Don't try to bundle these modules
    external: ["sqlite3"],
  },
  // Optimize dependencies but exclude native modules
  optimizeDeps: {
    exclude: ["sqlite3"],
  },
});
