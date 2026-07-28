import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

export default defineConfig({
  site: "https://tooonran.top",
  output: "static",
  integrations: [
    icon({
      include: {
        lucide: [
          "arrow-down",
          "arrow-right",
          "arrow-up-right",
          "badge-check",
          "camera",
          "chevron-left",
          "chevron-right",
          "code-xml",
          "database",
          "external-link",
          "languages",
          "layers-3",
          "leaf",
          "mail",
          "menu",
          "music",
          "palette",
          "pause",
          "pen-line",
          "play",
          "shapes",
          "terminal",
          "x",
        ],
        "simple-icons": [
          "bilibili",
          "deepl",
          "excalidraw",
          "figma",
          "github",
          "iconify",
          "mdnwebdocs",
          "notion",
          "openjdk",
          "qq",
          "redis",
          "springboot",
          "vuedotjs",
          "visualstudiocode",
        ],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
