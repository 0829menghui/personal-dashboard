import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/personal-dashboard/",
  server: {
    proxy: {
      "/personal-dashboard/api": {
        target: "http://127.0.0.1:8000",
        rewrite: (path) => path.replace(/^\/personal-dashboard\/api/, "/api"),
      },
    },
  },
});
