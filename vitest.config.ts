import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: [
      "server/**/__tests__/**/*.test.ts",
      "server/**/*.test.ts",
      "client/src/**/__tests__/**/*.test.ts",
    ],
    environment: "node",
    globals: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["server/**/*.ts"],
      exclude: ["server/**/__tests__/**", "server/**/*.test.ts", "server/vite.ts", "server/static.ts"],
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
      "@": path.resolve(__dirname, "client", "src"),
    },
  },
  esbuild: {
    // prerenderRender.test.ts imports the real page components, so .tsx has
    // to compile here. The app build gets the automatic JSX runtime from
    // @vitejs/plugin-react (vite.config.ts); this config loads no plugins, so
    // without this esbuild emits classic React.createElement calls and every
    // such test fails with "React is not defined".
    jsx: "automatic",
  },
});
