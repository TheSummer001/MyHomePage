import type { APIRoute } from "astro";
import { siteConfig } from "../config/site";

export const prerender = true;

export const GET: APIRoute = () => {
  const homepageUrl = new URL("/", siteConfig.siteUrl);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url>",
    `    <loc>${homepageUrl.href}</loc>`,
    "  </url>",
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
