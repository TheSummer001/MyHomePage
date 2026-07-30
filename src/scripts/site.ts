import APlayer from "aplayer";
import "aplayer/dist/APlayer.min.css";

const menuToggle = document.querySelector<HTMLButtonElement>("#menu-toggle");
const mobileMenu = document.querySelector<HTMLElement>("#mobile-menu");
const siteHeader = document.querySelector<HTMLElement>("#site-header");

function closeMenu() {
  if (!menuToggle || !mobileMenu) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "打开导航菜单");
  mobileMenu.classList.add("invisible", "translate-y-3", "opacity-0");
  mobileMenu.classList.remove("visible", "translate-y-0", "opacity-100");
  document.body.classList.remove("menu-open");
}

menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  if (open) {
    closeMenu();
    return;
  }
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "关闭导航菜单");
  mobileMenu?.classList.remove("invisible", "translate-y-3", "opacity-0");
  mobileMenu?.classList.add("visible", "translate-y-0", "opacity-100");
  document.body.classList.add("menu-open");
});

document.querySelectorAll<HTMLElement>("[data-scroll-target]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const targetId = link.dataset.scrollTarget;
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    closeMenu();
    target.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));

    const navbarHeight = siteHeader?.getBoundingClientRect().height ?? 80;
    const elementPosition = target.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: Math.max(0, elementPosition - navbarHeight),
      behavior: "smooth",
    });
  });
});

const navLinks = [...document.querySelectorAll<HTMLElement>("[data-nav]")];
const sections = [...document.querySelectorAll<HTMLElement>("[data-section][id]")].filter((section) =>
  navLinks.some((link) => link.dataset.nav === section.id),
);
const visibleSections = new Map<string, IntersectionObserverEntry>();

function updateActiveNav(sectionId: string) {
  navLinks.forEach((link) => {
    link.dataset.active = String(link.dataset.nav === sectionId);
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleSections.set(entry.target.id, entry);
      else visibleSections.delete(entry.target.id);
    });

    const navbarHeight = siteHeader?.getBoundingClientRect().height ?? 80;
    const visible = [...visibleSections.values()].sort((a, b) => {
      const ratioDifference = b.intersectionRatio - a.intersectionRatio;
      if (Math.abs(ratioDifference) > 0.05) return ratioDifference;
      return Math.abs(a.boundingClientRect.top - navbarHeight) -
        Math.abs(b.boundingClientRect.top - navbarHeight);
    })[0];
    if (!visible) return;

    updateActiveNav(visible.target.id);
  },
  { rootMargin: "-80px 0px -45% 0px", threshold: [0.05, 0.2, 0.5, 0.75] },
);

sections.forEach((section) => sectionObserver.observe(section));

let headerToneFrame = 0;
function updateHeaderTone() {
  if (!siteHeader) return;
  const probeY = Math.max(1, Math.round(siteHeader.getBoundingClientRect().height / 2));
  const underlyingSection = document
    .elementsFromPoint(window.innerWidth / 2, probeY)
    .map((element) => element.closest("[data-nav-tone]"))
    .find(Boolean);

  if (underlyingSection instanceof HTMLElement) {
    siteHeader.dataset.tone = underlyingSection.dataset.navTone || "light";
  }
}

function scheduleHeaderToneUpdate() {
  cancelAnimationFrame(headerToneFrame);
  headerToneFrame = requestAnimationFrame(updateHeaderTone);
}

window.addEventListener("scroll", scheduleHeaderToneUpdate, { passive: true });
window.addEventListener("resize", scheduleHeaderToneUpdate);
scheduleHeaderToneUpdate();

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const musicSection = document.querySelector<HTMLElement>("#music");
const playlistId = musicSection?.dataset.playlistId || "";
const playlistSources = [
  "/music.json",
  `https://api.injahow.cn/meting/?server=netease&type=playlist&id=${encodeURIComponent(playlistId)}`,
];
const trackContainer = document.querySelector<HTMLElement>("#music-track");
const engineContainer = document.querySelector<HTMLElement>("#aplayer-engine");
const musicStatus = document.querySelector<HTMLElement>("#music-status");
const musicPrev = document.querySelector<HTMLButtonElement>("#music-prev");
const musicNext = document.querySelector<HTMLButtonElement>("#music-next");
const miniPlayer = document.querySelector<HTMLElement>("#mini-player");
const playerToggle = document.querySelector<HTMLButtonElement>("#player-toggle");
const playerPlayIcon = playerToggle?.querySelector<HTMLElement>(".player-icon-play");
const playerPauseIcon = playerToggle?.querySelector<HTMLElement>(".player-icon-pause");
const playerName = document.querySelector<HTMLElement>("#player-name");
const playerArtist = document.querySelector<HTMLElement>("#player-artist");
const playerCover = document.querySelector<HTMLImageElement>("#player-cover");
const playerProgress = document.querySelector<HTMLElement>("#player-progress");
const musicCardPlayIcon =
  document.querySelector<HTMLElement>("#music-card-play-icon")?.innerHTML.trim() || "";
const musicExternalLinkIcon =
  document.querySelector<HTMLElement>("#music-external-link-icon")?.innerHTML.trim() || "";

interface Track {
  name: string;
  artist: string;
  url: string;
  cover: string;
  lrc: string;
}

function escapeHtml(value: unknown = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

function normalizeTracks(data: unknown): Track[] {
  const dataRecord = isRecord(data) ? data : null;
  const list = Array.isArray(data)
    ? data
    : dataRecord && Array.isArray(dataRecord.data)
      ? dataRecord.data
      : [];

  return list.flatMap((item) => {
    if (!isRecord(item)) return [];

    const name = firstString(item, ["name", "title"]);
    const url = firstString(item, ["url"]);
    if (!name || !url) return [];

    return [
      {
        name,
        artist: firstString(item, ["artist", "author"]) ?? "未知音乐人",
        url,
        cover: firstString(item, ["pic", "cover"]) ?? "",
        lrc: firstString(item, ["lrc"]) ?? "",
      },
    ];
  });
}

function renderTracks(tracks: Track[], player: APlayer) {
  if (!trackContainer) return;
  trackContainer.innerHTML = tracks
    .map(
      (track, index) => `
        <button class="music-card group w-full text-left" data-track-index="${index}">
          <span class="relative block aspect-square overflow-hidden rounded-2xl bg-white/5">
            <img src="${escapeHtml(track.cover)}" data-cover-source="${escapeHtml(track.cover)}" alt="" loading="lazy" draggable="false" class="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            <span class="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20"></span>
            <span class="absolute bottom-4 left-4 grid h-11 w-11 place-items-center rounded-full bg-white text-ink opacity-0 transition-all group-hover:opacity-100">
              ${musicCardPlayIcon}
            </span>
          </span>
          <span class="mt-4 block truncate text-base font-semibold">${escapeHtml(track.name)}</span>
          <span class="mt-1 block truncate text-xs text-white/42">${escapeHtml(track.artist)}</span>
        </button>
      `,
    )
    .join("");

  trackContainer.querySelectorAll<HTMLButtonElement>("[data-track-index]").forEach((card) => {
    card.addEventListener("click", () => {
      if (trackContainer.dataset.dragged === "true") return;
      player.list.switch(Number(card.dataset.trackIndex));
      player.play();
      card.blur();
    });
  });

  const coverObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(async (entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        if (!(entry.target instanceof HTMLImageElement)) return;
        const image = entry.target;
        const source = image.dataset.coverSource;
        if (!source) return;

        try {
          const response = await fetch(source, { mode: "cors" });
          const resolvedUrl = response.url.replace("param=90y90", "param=600y600");
          await response.body?.cancel();
          if (resolvedUrl && resolvedUrl !== source) image.src = resolvedUrl;
        } catch {
          // Keep the original cover when high-resolution resolution fails.
        }
      });
    },
    { root: trackContainer, rootMargin: "0px 420px" },
  );

  trackContainer
    .querySelectorAll<HTMLImageElement>("[data-cover-source]")
    .forEach((image) => coverObserver.observe(image));

  if (musicStatus) musicStatus.textContent = `已载入 ${tracks.length} 首歌曲，点击封面开始播放。`;
}

async function fetchPlaylist(): Promise<Track[]> {
  for (const source of playlistSources) {
    try {
      const response = await fetch(source, { mode: "cors" });
      if (!response.ok) continue;
      const tracks = normalizeTracks(await response.json());
      if (tracks.length) return tracks;
    } catch {
      // Try the next source.
    }
  }
  throw new Error("All playlist sources are unavailable");
}

async function initMusic() {
  if (!trackContainer || !engineContainer) return;

  try {
    const tracks = await fetchPlaylist();

    const player = new APlayer({
      container: engineContainer,
      audio: tracks,
      preload: "metadata",
      mutex: true,
      volume: 0.7,
    });

    renderTracks(tracks, player);

    function updateMeta() {
      const index = player.list.index;
      const track = tracks[index];
      if (!track) return;
      if (playerName) playerName.textContent = track.name;
      if (playerArtist) playerArtist.textContent = track.artist;
      if (playerCover) playerCover.src = track.cover;
      miniPlayer?.classList.remove("translate-y-full", "opacity-0", "pointer-events-none");
      miniPlayer?.classList.add("translate-y-0", "opacity-100", "pointer-events-auto");
    }

    player.on("play", () => {
      updateMeta();
      playerPlayIcon?.classList.add("hidden");
      playerPauseIcon?.classList.remove("hidden");
      playerToggle?.setAttribute("aria-label", "暂停");
    });
    player.on("pause", () => {
      playerPlayIcon?.classList.remove("hidden");
      playerPauseIcon?.classList.add("hidden");
      playerToggle?.setAttribute("aria-label", "播放");
    });
    player.on("listswitch", updateMeta);
    player.on("timeupdate", () => {
      const audio = player.audio;
      const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      if (playerProgress) playerProgress.style.width = `${progress}%`;
    });

    playerToggle?.addEventListener("click", () => {
      if (player.audio.paused) player.play();
      else player.pause();
    });
  } catch (error) {
    console.warn("Playlist unavailable.", error);
    trackContainer.innerHTML = `
      <div class="w-[min(100%-2rem,560px)] rounded-2xl border border-white/12 bg-white/4 p-7">
        <p class="text-base font-semibold">歌单暂时无法加载</p>
        <p class="mt-2 text-sm leading-6 text-white/45">音乐服务可能正在维护，可以稍后重试，或直接前往网易云查看歌单。</p>
        <a href="https://music.163.com/playlist?id=${encodeURIComponent(playlistId)}" target="_blank" rel="noreferrer" class="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold transition-colors hover:border-coral">
          打开网易云歌单
          ${musicExternalLinkIcon}
        </a>
      </div>
    `;
    if (musicStatus) musicStatus.textContent = "未能连接音乐服务。";
  }
}

musicPrev?.addEventListener("click", () => {
  pauseAutoScroll();
  trackContainer?.scrollBy({ left: -580, behavior: "smooth" });
});

musicNext?.addEventListener("click", () => {
  pauseAutoScroll();
  trackContainer?.scrollBy({ left: 580, behavior: "smooth" });
});

let dragStartX = 0;
let dragStartScrollLeft = 0;
let isPointerDownTrack = false;
let isDraggingTrack = false;
let isTrackFocused = false;
let autoScrollPausedUntil = 0;

function pauseAutoScroll(duration = 3500) {
  autoScrollPausedUntil = Date.now() + duration;
}

function resumeAutoScroll() {
  autoScrollPausedUntil = 0;
}

trackContainer?.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  isPointerDownTrack = true;
  isDraggingTrack = false;
  dragStartX = event.clientX;
  dragStartScrollLeft = trackContainer.scrollLeft;
  trackContainer.dataset.dragged = "false";
  autoScrollPausedUntil = Number.POSITIVE_INFINITY;
});

trackContainer?.addEventListener("pointermove", (event) => {
  if (!isPointerDownTrack) return;
  const distance = event.clientX - dragStartX;
  if (!isDraggingTrack && Math.abs(distance) > 5) {
    isDraggingTrack = true;
    trackContainer.dataset.dragged = "true";
    trackContainer.classList.add("is-dragging", "cursor-grabbing");
    trackContainer.classList.remove("cursor-grab");
    trackContainer.setPointerCapture(event.pointerId);
  }
  if (!isDraggingTrack) return;
  trackContainer.scrollLeft = dragStartScrollLeft - distance;
  event.preventDefault();
});

function finishTrackDrag(event: PointerEvent) {
  if (!trackContainer || !isPointerDownTrack) return;
  isPointerDownTrack = false;
  isDraggingTrack = false;
  trackContainer.classList.remove("is-dragging", "cursor-grabbing");
  trackContainer.classList.add("cursor-grab");
  if (trackContainer.hasPointerCapture(event.pointerId)) {
    trackContainer.releasePointerCapture(event.pointerId);
  }
  resumeAutoScroll();
  setTimeout(() => {
    if (trackContainer) trackContainer.dataset.dragged = "false";
  }, 80);
}

trackContainer?.addEventListener("pointerup", finishTrackDrag);
trackContainer?.addEventListener("pointercancel", finishTrackDrag);
trackContainer?.addEventListener("pointerleave", finishTrackDrag);
trackContainer?.addEventListener("wheel", () => pauseAutoScroll(250), { passive: true });
trackContainer?.addEventListener("focusin", () => {
  isTrackFocused = true;
});
trackContainer?.addEventListener("focusout", () => {
  requestAnimationFrame(() => {
    if (!trackContainer.contains(document.activeElement)) {
      isTrackFocused = false;
      resumeAutoScroll();
    }
  });
});

if (trackContainer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let previousAutoScrollTime = Date.now();

  setInterval(() => {
    const now = Date.now();
    const elapsed = Math.min(now - previousAutoScrollTime, 1000);
    previousAutoScrollTime = now;
    if (
      Date.now() > autoScrollPausedUntil &&
      !isPointerDownTrack &&
      !isDraggingTrack &&
      !isTrackFocused &&
      document.visibilityState === "visible" &&
      trackContainer.scrollWidth > trackContainer.clientWidth
    ) {
      trackContainer.scrollLeft += (elapsed / 1000) * 22;
      if (trackContainer.scrollLeft >= trackContainer.scrollWidth - trackContainer.clientWidth - 1) {
        trackContainer.scrollLeft = 0;
      }
    }
  }, 50);
}

initMusic();
