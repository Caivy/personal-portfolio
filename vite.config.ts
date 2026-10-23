import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { workAdmin } from "./vite-plugin-work-admin";

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(command === "serve" ? [workAdmin()] : []), // ADDED: dev server only
  ],
}));
