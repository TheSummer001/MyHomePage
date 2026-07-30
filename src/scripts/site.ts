import APlayer from "aplayer";
import "aplayer/dist/APlayer.min.css";

const menuToggle = document.querySelector<HTMLButtonElement>("#menu-toggle");
const mobileMenu = document.querySelector<HTMLElement>("#mobile-menu");
const siteHeader = document.querySelector<HTMLElement>("#site-header");
const menuDismiss = mobileMenu?.querySelector<HTMLElement>("[data-menu-dismiss]");
const mobileNavLinks = [...(mobileMenu?.querySelectorAll<HTMLAnchorElement>("[data-mobile-nav]") ?? [])];
let menuReturnFocus: HTMLElement | null = null;

function isMenuOpen() {
  return menuToggle?.getAttribute("aria-expanded") === "true";
}

function closeMenu(restoreFocus = true) {
  if (!menuToggle || !mobileMenu) return;
  const wasOpen = isMenuOpen();
  if (wasOpen && mobileMenu.contains(document.activeElement)) {
    menuToggle.focus({ preventScroll: true });
  }
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "打开导航菜单");
  mobileMenu.setAttribute("aria-hidden", "true");
  mobileMenu.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  if (wasOpen && restoreFocus) {
    (menuReturnFocus ?? menuToggle).focus({ preventScroll: true });
  }
  menuReturnFocus = null;
}

function openMenu() {
  if (!menuToggle || !mobileMenu) return;
  menuReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : menuToggle;
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "关闭导航菜单");
  mobileMenu.setAttribute("aria-hidden", "false");
  mobileMenu.classList.add("is-open");
  document.body.classList.add("menu-open");
  requestAnimationFrame(() => mobileNavLinks[0]?.focus({ preventScroll: true }));
}

menuToggle?.addEventListener("click", () => {
  if (isMenuOpen()) {
    closeMenu();
    return;
  }
  openMenu();
});

menuDismiss?.addEventListener("click", () => closeMenu());

mobileNavLinks.forEach((link) => {
  if (link.dataset.scrollTarget) return;
  link.addEventListener("click", () => closeMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (!isMenuOpen() || !siteHeader) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = [...siteHeader.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => {
    const style = window.getComputedStyle(element);
    return (
      element.tabIndex >= 0 &&
      element.getClientRects().length > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none"
    );
  });
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768 && isMenuOpen()) closeMenu(false);
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
    const active = link.dataset.nav === sectionId;
    link.dataset.active = String(active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
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
const musicSourceName = musicSection?.dataset.musicSourceName || "juhe";
const musicSourceEndpoint = musicSection?.dataset.musicSourceEndpoint || "/api/music-url";
const musicSourcePlatform = musicSection?.dataset.musicSourcePlatform || "wy";
const musicSourceQuality = musicSection?.dataset.musicSourceQuality || "320k";
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
const musicErrorIcon =
  document.querySelector<HTMLElement>("#music-error-icon")?.innerHTML.trim() || "";
const musicRetryIcon =
  document.querySelector<HTMLElement>("#music-retry-icon")?.innerHTML.trim() || "";

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
  cover: string;
  lrc: string;
}

function setMusicNavigationDisabled(disabled: boolean) {
  if (musicPrev) musicPrev.disabled = disabled;
  if (musicNext) musicNext.disabled = disabled;
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

function getTrackId(item: Record<string, unknown>, url: string): string {
  const explicitId = item.id;
  if (typeof explicitId === "string" || typeof explicitId === "number") return String(explicitId);

  try {
    return new URL(url, window.location.href).searchParams.get("id") ?? "";
  } catch {
    return "";
  }
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
        id: getTrackId(item, url),
        name,
        artist: firstString(item, ["artist", "author"]) ?? "未知音乐人",
        url,
        cover: firstString(item, ["pic", "cover"]) ?? "",
        lrc: firstString(item, ["lrc"]) ?? "",
      },
    ];
  });
}

function renderTracks(tracks: Track[], playTrack: (index: number) => void) {
  if (!trackContainer) return;
  trackContainer.dataset.state = "ready";
  trackContainer.removeAttribute("aria-busy");
  setMusicNavigationDisabled(false);
  if (musicStatus) musicStatus.hidden = false;
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
    const index = Number(card.dataset.trackIndex);
    card.addEventListener("click", () => {
      if (trackContainer.dataset.dragged === "true") return;
      playTrack(index);
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

async function fetchPlaylist(bypassCache = false): Promise<Track[]> {
  for (const source of playlistSources) {
    try {
      const response = await fetch(source, {
        mode: "cors",
        ...(bypassCache ? { cache: "no-store" as const } : {}),
      });
      if (!response.ok) continue;
      const tracks = normalizeTracks(await response.json());
      if (tracks.length) return tracks;
    } catch {
      // Try the next source.
    }
  }
  throw new Error("All playlist sources are unavailable");
}

function renderPlaylistError(isRetry: boolean) {
  if (!trackContainer) return;

  setMusicNavigationDisabled(true);
  trackContainer.dataset.state = "error";
  trackContainer.removeAttribute("aria-busy");
  trackContainer.innerHTML = `
    <div class="w-full rounded-3xl border border-white/12 bg-white/[0.04] p-6 sm:p-8">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-start gap-4">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-coral/35 bg-coral/10 text-coral">
            ${musicErrorIcon}
          </span>
          <div class="max-w-xl" role="status">
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-coral">Signal interrupted / 信号中断</p>
            <p class="mt-2 text-lg font-semibold text-white">歌单暂时无法加载</p>
            <p data-music-error-description class="mt-2 text-sm leading-6 text-white/45">
              ${
                isRetry
                  ? "仍未连接音乐服务，请稍后再试，或直接前往网易云查看歌单。"
                  : "音乐服务可能正在维护，可以稍后重试，或直接前往网易云查看歌单。"
              }
            </p>
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap gap-3 sm:justify-end">
          <button type="button" data-music-retry class="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-coral hover:text-white disabled:cursor-wait disabled:bg-white/65 disabled:text-ink/60">
            <span data-music-retry-icon class="inline-flex">${musicRetryIcon}</span>
            <span data-music-retry-label>重新加载</span>
          </button>
          <a href="https://music.163.com/playlist?id=${encodeURIComponent(playlistId)}" target="_blank" rel="noreferrer" class="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-coral">
            打开网易云歌单
            ${musicExternalLinkIcon}
          </a>
        </div>
      </div>
    </div>
  `;

  if (musicStatus) {
    musicStatus.textContent = "";
    musicStatus.hidden = true;
  }

  const retryButton = trackContainer.querySelector<HTMLButtonElement>("[data-music-retry]");
  retryButton?.addEventListener("click", () => {
    retryButton.disabled = true;
    retryButton.setAttribute("aria-busy", "true");
    retryButton.querySelector<HTMLElement>("[data-music-retry-icon]")?.classList.add("motion-safe:animate-spin");
    const retryLabel = retryButton.querySelector<HTMLElement>("[data-music-retry-label]");
    const description = trackContainer.querySelector<HTMLElement>("[data-music-error-description]");
    if (retryLabel) retryLabel.textContent = "正在重试…";
    if (description) description.textContent = "正在重新连接音乐服务，请稍候。";
    if (musicStatus) {
      musicStatus.hidden = false;
      musicStatus.textContent = "正在重新连接歌单…";
    }
    trackContainer.setAttribute("aria-busy", "true");
    void initMusic(true);
  });
}

async function initMusic(isRetry = false) {
  if (!trackContainer || !engineContainer) return;

  setMusicNavigationDisabled(true);

  try {
    const tracks = await fetchPlaylist(isRetry);
    const resolvedUrls = new Map<string, Promise<string>>();
    const resolvedSourceLabels = new Map<string, string>();

    const player = new APlayer({
      container: engineContainer,
      audio: tracks,
      preload: "metadata",
      mutex: true,
      volume: 0.7,
    });
    player.list.audios.forEach((audio) => {
      audio.url = "";
    });
    player.audio.addEventListener(
      "error",
      (event) => {
        event.stopImmediatePropagation();
        const failedTrack = tracks[player.list.index];
        if (failedTrack?.id) {
          resolvedUrls.delete(failedTrack.id);
          resolvedSourceLabels.delete(failedTrack.id);
        }
        const failedPlayerTrack = player.list.audios[player.list.index];
        if (failedPlayerTrack) failedPlayerTrack.url = "";
        player.pause();
        if (musicStatus) {
          musicStatus.textContent = "当前完整音源无法播放，已停止自动切换。";
        }
      },
      { capture: true },
    );

    function resolveTrackUrl(track: Track): Promise<string> {
      if (!track.id) return Promise.reject(new Error("歌曲缺少可解析的网易云 ID"));
      const cached = resolvedUrls.get(track.id);
      if (cached) return cached;

      const request = fetch(musicSourceEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: musicSourcePlatform,
          quality: musicSourceQuality,
          trackId: track.id,
        }),
      })
        .then(async (response) => {
          const data: unknown = await response.json();
          if (!response.ok || !isRecord(data) || typeof data.url !== "string") {
            const message = isRecord(data) && typeof data.error === "string" ? data.error : "音源未返回播放地址";
            throw new Error(message);
          }
          const parsedUrl = new URL(data.url);
          if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
            throw new Error("音源返回了无效播放地址");
          }
          const provider =
            typeof data.provider === "string"
              ? data.provider === "netease"
                ? "网易云直连"
                : data.provider
              : musicSourceName;
          const quality = typeof data.quality === "string" ? data.quality : musicSourceQuality;
          resolvedSourceLabels.set(track.id, `${provider} / ${quality}`);
          return parsedUrl.href;
        })
        .catch((error) => {
          resolvedUrls.delete(track.id);
          resolvedSourceLabels.delete(track.id);
          throw error;
        });
      resolvedUrls.set(track.id, request);
      return request;
    }

    async function cacheTrackUrl(index: number): Promise<string> {
      const track = tracks[index];
      if (!track) throw new Error(`Track ${index} does not exist`);
      const url = await resolveTrackUrl(track);
      const playerTrack = player.list.audios[index];
      if (playerTrack) playerTrack.url = url;
      return url;
    }

    let playRequest = 0;
    async function playTrack(index: number) {
      const track = tracks[index];
      if (!track) return;

      const request = ++playRequest;
      if (!player.audio.paused) player.pause();
      if (musicStatus) musicStatus.textContent = `正在解析「${track.name}」的播放地址…`;

      try {
        const url = await cacheTrackUrl(index);
        if (request !== playRequest) return;

        if (player.list.index !== index) player.list.switch(index);
        if (player.audio.src !== url) player.audio.src = url;
        player.play();
        if (tracks.length > 1) void cacheTrackUrl((index + 1) % tracks.length).catch(() => {});
        if (musicStatus) {
          const sourceLabel =
            resolvedSourceLabels.get(track.id) ??
            `${musicSourceName} / ${musicSourcePlatform.toUpperCase()} ${musicSourceQuality}`;
          musicStatus.textContent = `正在通过 ${sourceLabel} 音源播放。`;
        }
      } catch (error) {
        if (request !== playRequest) return;
        player.pause();
        console.warn(`Music source unavailable for track ${track.id}.`, error);
        if (musicStatus) {
          musicStatus.textContent = "完整音源暂时不可用，已停止播放以避免使用短试听。";
        }
      }
    }

    renderTracks(tracks, (index) => void playTrack(index));

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
      if (player.audio.paused) void playTrack(player.list.index);
      else player.pause();
    });
  } catch (error) {
    console.warn("Playlist unavailable.", error);
    renderPlaylistError(isRetry);
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
