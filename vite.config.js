import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: { rollupOptions: { input: { main: "index.html", app: "app.html" } } },
  server: { host: "127.0.0.1", port: 8107, strictPort: true },
});
