export interface FeedEntry {
  title: string;
  href: string;
  excerpt: string;
  date: string;
  tag: string;
}
function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

export function parseRss(xml: string, limit = 3): FeedEntry[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, limit)
    .map((match) => {
      const block = match[1];
      const publishedAt = new Date(readTag(block, "pubDate"));
      const date = Number.isNaN(publishedAt.getTime())
        ? ""
        : new Intl.DateTimeFormat("zh-CN", {
            timeZone: "Asia/Shanghai",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
            .format(publishedAt)
            .replaceAll("/", ".");

      return {
        title: readTag(block, "title"),
        href: readTag(block, "link"),
        excerpt: readTag(block, "description"),
        date,
        tag: readTag(block, "category") || "Article",
      };
    })
    .filter((entry) => entry.title && entry.href);
}
