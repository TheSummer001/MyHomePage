import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { siteConfig } from "./src/config/site";

export default defineConfig({
  site: siteConfig.siteUrl,
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
          "activity",
          "file-text",
          "folder-open",
          "home",
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
          "radio-tower",
          "refresh-cw",
          "shapes",
          "terminal",
          "user",
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
