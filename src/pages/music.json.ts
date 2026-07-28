import type { APIRoute } from "astro";
import { siteConfig } from "../config/site";

export const prerender = true;

export const GET: APIRoute = async () => {
  const endpoint = `https://api.injahow.cn/meting/?server=netease&type=playlist&id=${siteConfig.playlistId}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Meting API returned ${response.status}`);

    const tracks = await response.json();
    return new Response(JSON.stringify(tracks), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("[]", {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
};
