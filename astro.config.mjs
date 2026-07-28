import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://tooonran.top",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
