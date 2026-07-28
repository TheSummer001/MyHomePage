const menuToggle = document.querySelector("#menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");

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

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    closeMenu();
    target.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    window.scrollTo({ top: target.offsetTop, behavior: "auto" });
    history.replaceState(null, "", link.getAttribute("href"));
  });
});

if (location.hash) {
  const initialTarget = document.querySelector(location.hash);
  if (initialTarget) {
    requestAnimationFrame(() => window.scrollTo({ top: initialTarget.offsetTop, behavior: "auto" }));
  }
}

const sections = [...document.querySelectorAll("[data-section]")];
const navLinks = [...document.querySelectorAll("[data-nav]")];
const siteHeader = document.querySelector("#site-header");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navLinks.forEach((link) => {
      link.dataset.active = String(link.dataset.nav === visible.target.id);
    });
  },
  { rootMargin: "-25% 0px -55%", threshold: [0.05, 0.2, 0.5] },
);

sections.forEach((section) => sectionObserver.observe(section));

let headerToneFrame;
function updateHeaderTone() {
  if (!siteHeader) return;
  const probeY = Math.max(1, Math.round(siteHeader.getBoundingClientRect().height / 2));
  const underlyingSection = document
    .elementsFromPoint(window.innerWidth / 2, probeY)
    .map((element) => element.closest("[data-nav-tone]"))
    .find(Boolean);

  if (underlyingSection) {
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

const musicSection = document.querySelector("#music");
const playlistId = musicSection?.dataset.playlistId || "";
const playlistSources = [
  "/music.json",
  `https://api.injahow.cn/meting/?server=netease&type=playlist&id=${encodeURIComponent(playlistId)}`,
];
const trackContainer = document.querySelector("#music-track");
const engineContainer = document.querySelector("#aplayer-engine");
const musicStatus = document.querySelector("#music-status");
const musicPrev = document.querySelector("#music-prev");
const musicNext = document.querySelector("#music-next");
const miniPlayer = document.querySelector("#mini-player");
const playerToggle = document.querySelector("#player-toggle");
const playerPlayIcon = playerToggle?.querySelector(".player-icon-play");
const playerPauseIcon = playerToggle?.querySelector(".player-icon-pause");
const playerName = document.querySelector("#player-name");
const playerArtist = document.querySelector("#player-artist");
const playerCover = document.querySelector("#player-cover");
const playerProgress = document.querySelector("#player-progress");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeTracks(data) {
  const list = Array.isArray(data) ? data : data?.data || [];
  return list
    .map((track) => ({
      name: track.name || track.title,
      artist: track.artist || track.author || "未知音乐人",
      url: track.url,
      cover: track.pic || track.cover,
      lrc: track.lrc || "",
    }))
    .filter((track) => track.name && track.url);
}

function renderTracks(tracks, player) {
  if (!trackContainer) return;
  trackContainer.innerHTML = tracks
    .map(
      (track, index) => `
        <button class="music-card group w-full text-left" data-track-index="${index}">
          <span class="relative block aspect-square overflow-hidden rounded-2xl bg-white/5">
            <img src="${escapeHtml(track.cover)}" data-cover-source="${escapeHtml(track.cover)}" alt="" loading="lazy" draggable="false" class="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            <span class="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20"></span>
            <span class="absolute bottom-4 left-4 grid h-11 w-11 place-items-center rounded-full bg-white text-ink opacity-0 transition-all group-hover:opacity-100">
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"></path></svg>
            </span>
          </span>
          <span class="mt-4 block truncate text-base font-semibold">${escapeHtml(track.name)}</span>
          <span class="mt-1 block truncate text-xs text-white/42">${escapeHtml(track.artist)}</span>
        </button>
      `,
    )
    .join("");

  trackContainer.querySelectorAll("[data-track-index]").forEach((card) => {
    card.addEventListener("click", () => {
      if (trackContainer.dataset.dragged === "true") return;
      player.list.switch(Number(card.dataset.trackIndex));
      player.play();
    });
  });

  const coverObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(async (entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

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

  trackContainer.querySelectorAll("[data-cover-source]").forEach((image) => coverObserver.observe(image));

  if (musicStatus) musicStatus.textContent = `已载入 ${tracks.length} 首歌曲，点击封面开始播放。`;
}

async function fetchPlaylist() {
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
  if (!trackContainer || !engineContainer || !window.APlayer) return;

  try {
    const tracks = await fetchPlaylist();

    const player = new window.APlayer({
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
      playerName.textContent = track.name;
      playerArtist.textContent = track.artist;
      playerCover.src = track.cover;
      miniPlayer.classList.remove("translate-y-full", "opacity-0", "pointer-events-none");
      miniPlayer.classList.add("translate-y-0", "opacity-100", "pointer-events-auto");
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
      playerProgress.style.width = `${progress}%`;
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
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"></path><path d="M7 7h10v10"></path></svg>
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
let isDraggingTrack = false;
let autoScrollPausedUntil = 0;

function pauseAutoScroll(duration = 3500) {
  autoScrollPausedUntil = Date.now() + duration;
}

trackContainer?.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  isDraggingTrack = true;
  dragStartX = event.clientX;
  dragStartScrollLeft = trackContainer.scrollLeft;
  trackContainer.dataset.dragged = "false";
  trackContainer.classList.add("is-dragging", "cursor-grabbing");
  trackContainer.classList.remove("cursor-grab");
  trackContainer.setPointerCapture(event.pointerId);
  pauseAutoScroll();
});

trackContainer?.addEventListener("pointermove", (event) => {
  if (!isDraggingTrack) return;
  const distance = event.clientX - dragStartX;
  if (Math.abs(distance) > 4) trackContainer.dataset.dragged = "true";
  trackContainer.scrollLeft = dragStartScrollLeft - distance;
  event.preventDefault();
});

function finishTrackDrag(event) {
  if (!trackContainer || !isDraggingTrack) return;
  isDraggingTrack = false;
  trackContainer.classList.remove("is-dragging", "cursor-grabbing");
  trackContainer.classList.add("cursor-grab");
  if (trackContainer.hasPointerCapture(event.pointerId)) {
    trackContainer.releasePointerCapture(event.pointerId);
  }
  pauseAutoScroll();
  setTimeout(() => {
    if (trackContainer) trackContainer.dataset.dragged = "false";
  }, 80);
}

trackContainer?.addEventListener("pointerup", finishTrackDrag);
trackContainer?.addEventListener("pointercancel", finishTrackDrag);
trackContainer?.addEventListener("wheel", () => pauseAutoScroll(), { passive: true });
trackContainer?.addEventListener("mouseenter", () => pauseAutoScroll(800));
trackContainer?.addEventListener("focusin", () => pauseAutoScroll());

if (trackContainer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let previousAutoScrollTime = Date.now();

  setInterval(() => {
    const now = Date.now();
    const elapsed = Math.min(now - previousAutoScrollTime, 1000);
    previousAutoScrollTime = now;
    if (
      Date.now() > autoScrollPausedUntil &&
      !isDraggingTrack &&
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
