const MUSIC_API_URL = "https://api.music.lerd.dpdns.org";
const NETEASE_MEDIA_URL = "https://music.163.com/song/media/outer/url";
const SUPPORTED_QUALITIES = new Set(["128k", "320k", "flac", "flac24bit", "master"]);
const MIN_FULL_TRACK_BYTES = 750_000;

interface MusicApiResponse {
  code?: number;
  data?: {
    url?: string;
  };
  msg?: string;
}

interface ResolvedMusicUrl {
  provider: string;
  quality: string;
  url: string;
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function extractMusicUrl(value: unknown, depth = 0): string | null {
  if (depth > 4) return null;
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  for (const key of ["url", "data", "body", "result"]) {
    const resolved = extractMusicUrl(record[key], depth + 1);
    if (resolved) return resolved;
  }
  return null;
}

function getResponseSize(response: Response): number | null {
  const contentRange = response.headers.get("Content-Range");
  const rangeMatch = contentRange?.match(/\/(\d+)$/);
  if (rangeMatch) return Number(rangeMatch[1]);

  const contentLength = response.headers.get("Content-Length");
  return contentLength && /^\d+$/.test(contentLength) ? Number(contentLength) : null;
}

async function verifyFullTrack(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Range: "bytes=0-1023",
      "User-Agent": "Mozilla/5.0",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(8_000),
  });

  try {
    if (!response.ok) throw new Error(`media returned HTTP ${response.status}`);
    if (!response.headers.get("Content-Type")?.toLowerCase().includes("audio")) {
      throw new Error("media response is not audio");
    }

    const totalBytes = getResponseSize(response);
    if (totalBytes !== null && totalBytes < MIN_FULL_TRACK_BYTES) {
      throw new Error("media response is only a short preview");
    }

    const resolvedUrl = new URL(response.url);
    if (resolvedUrl.protocol === "http:") resolvedUrl.protocol = "https:";
    return resolvedUrl.href;
  } finally {
    await response.body?.cancel();
  }
}

async function resolveWithNetease(trackId: string): Promise<ResolvedMusicUrl> {
  const url = new URL(NETEASE_MEDIA_URL);
  url.searchParams.set("id", `${trackId}.mp3`);
  const musicUrl = await verifyFullTrack(url.href);
  return { provider: "netease", quality: "128k", url: musicUrl };
}

async function resolveWithJuhe(source: string, trackId: string, quality: string): Promise<ResolvedMusicUrl> {
  const response = await fetch(`${MUSIC_API_URL}/${source}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: quality,
      musicInfo: {
        source,
        songmid: trackId,
        hash: trackId,
      },
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error(`juhe returned HTTP ${response.status}`);

  const result = (await response.json()) as MusicApiResponse;
  const musicUrl = extractMusicUrl(result.data);
  if (result.code !== 200 || !musicUrl) {
    throw new Error(result.msg || "juhe returned no playable URL");
  }

  return {
    provider: "juhe",
    quality,
    url: await verifyFullTrack(musicUrl),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const source = typeof body.source === "string" ? body.source : "";
    const trackId = typeof body.trackId === "string" ? body.trackId : "";
    const quality = typeof body.quality === "string" ? body.quality : "";

    if (source !== "wy" || !/^\d+$/.test(trackId) || !SUPPORTED_QUALITIES.has(quality)) {
      return json({ error: "Invalid music source request" }, { status: 400 });
    }

    for (const resolver of [
      () => resolveWithNetease(trackId),
      () => resolveWithJuhe(source, trackId, quality),
    ]) {
      try {
        return json(await resolver());
      } catch {
        // Try the next full-track source.
      }
    }

    return json({ error: "No verified full-track source is currently available" }, { status: 502 });
  } catch {
    return json({ error: "Unable to resolve the requested music source" }, { status: 502 });
  }
}

export function GET() {
  return json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
