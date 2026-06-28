const STORAGE = {
  interval: "worldcup_slide_interval",
};
const WIB_TIMEZONE = "Asia/Jakarta";
const UPCOMING_LIMIT = 4;
const FEATURED_SCORE_LIMIT = 2;
const BRACKET_REGIONS = [
  { title: "Jalur Paruh Atas", slots: [1, 2, 3, 4] },
  { title: "Jalur Paruh Tengah A", slots: [5, 6, 7, 8] },
  { title: "Jalur Paruh Tengah B", slots: [9, 10, 11, 12] },
  { title: "Jalur Paruh Bawah", slots: [13, 14, 15, 16] },
];

const fallbackMatches = [
  {
    id: "canada-qatar-20260619",
    home: "Canada",
    away: "Qatar",
    homeScore: 6,
    awayScore: 0,
    status: "FT",
    elapsed: 90,
    kickoff: "2026-06-18T22:00:00Z",
    venue: "BC Place, Vancouver",
    group: "Group B",
    league: "World Cup",
  },
  {
    id: "mexico-korea-20260619",
    home: "Mexico",
    away: "Korea Republic",
    homeScore: 1,
    awayScore: 0,
    status: "FT",
    elapsed: 90,
    kickoff: "2026-06-19T01:00:00Z",
    venue: "Guadalajara Stadium",
    group: "Group A",
    league: "World Cup",
  },
  {
    id: "usa-australia-20260620",
    home: "United States",
    away: "Australia",
    homeScore: null,
    awayScore: null,
    status: "NS",
    elapsed: null,
    kickoff: "2026-06-19T19:00:00Z",
    venue: "Lumen Field, Seattle",
    group: "Group D",
    league: "World Cup",
  },
  {
    id: "scotland-morocco-20260620",
    home: "Scotland",
    away: "Morocco",
    homeScore: null,
    awayScore: null,
    status: "NS",
    elapsed: null,
    kickoff: "2026-06-19T22:00:00Z",
    venue: "Gillette Stadium, Foxborough",
    group: "Group C",
    league: "World Cup",
  },
  {
    id: "brazil-haiti-20260620",
    home: "Brazil",
    away: "Haiti",
    homeScore: null,
    awayScore: null,
    status: "NS",
    elapsed: null,
    kickoff: "2026-06-20T00:30:00Z",
    venue: "Lincoln Financial Field, Philadelphia",
    group: "Group C",
    league: "World Cup",
  },
  {
    id: "turkiye-paraguay-20260620",
    home: "Turkiye",
    away: "Paraguay",
    homeScore: null,
    awayScore: null,
    status: "NS",
    elapsed: null,
    kickoff: "2026-06-20T03:00:00Z",
    venue: "Levi's Stadium, Santa Clara",
    group: "Group D",
    league: "World Cup",
  },
];

const slides = Array.from(document.querySelectorAll(".slide"));
const stage = document.querySelector(".stage");
const liveMatches = document.querySelector("#liveMatches");
const scheduleMatches = document.querySelector("#scheduleMatches");
const bracketBoard = document.querySelector("#bracketBoard");
const activeLabel = document.querySelector("#activeLabel");
const dataStatus = document.querySelector("#dataStatus");
const liveHeading = document.querySelector("#liveHeading");
const liveCount = document.querySelector("#liveCount");
const scheduleCount = document.querySelector("#scheduleCount");
const bracketCount = document.querySelector("#bracketCount");
const localDate = document.querySelector("#localDate");
const localTime = document.querySelector("#localTime");
const pauseIcon = document.querySelector("#pauseIcon");

let activeSlide = 0;
let isPaused = false;
let timer = null;
let refreshTimer = null;
let slideInterval = Number(localStorage.getItem(STORAGE.interval)) || 15000;

init();

function init() {
  stage.dataset.mode = slides[activeSlide].id.replace("Slide", "");
  bindControls();
  tickClock();
  setInterval(tickClock, 1000);
  loadData();
  startSlideshow();
  refreshTimer = setInterval(loadData, 60_000);
  window.addEventListener("beforeunload", () => clearInterval(refreshTimer));
}

function bindControls() {
  document.querySelector("#prevBtn").addEventListener("click", () => showSlide(activeSlide - 1));
  document.querySelector("#nextBtn").addEventListener("click", () => showSlide(activeSlide + 1));
  document.querySelector("#refreshBtn").addEventListener("click", loadData);
  document.querySelector("#pauseBtn").addEventListener("click", () => {
    isPaused = !isPaused;
    pauseIcon.textContent = isPaused ? "▶" : "Ⅱ";
    startSlideshow();
  });
}

function startSlideshow() {
  clearInterval(timer);
  if (isPaused) return;
  timer = setInterval(() => showSlide(activeSlide + 1), slideInterval);
}

function showSlide(index) {
  activeSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => slide.classList.toggle("active", i === activeSlide));
  stage.dataset.mode = slides[activeSlide].id.replace("Slide", "");
  activeLabel.textContent = slides[activeSlide].dataset.title;
  if (window.matchMedia("(max-width: 760px)").matches) {
    document.scrollingElement.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  startSlideshow();
}

function tickClock() {
  const now = new Date();
  localDate.textContent = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: WIB_TIMEZONE,
  }).format(now);
  localTime.textContent = `${formatTime(now)} WIB`;
}

async function loadData() {
  if (dataStatus) dataStatus.textContent = "Memuat data";
  try {
    const matches = await fetchMatches();
    render(matches, matches.source);
  } catch (error) {
    console.warn(error);
    render({ items: fallbackMatches, source: "Demo data" });
  }
}

async function fetchMatches() {
  const localEndpoint = await fetchLocalEndpoint();
  if (localEndpoint.items.length) return localEndpoint;

  return { items: fallbackMatches, source: "Demo data" };
}

async function fetchLocalEndpoint() {
  try {
    const response = await fetch("./data/matches.json", { cache: "no-store" });
    if (!response.ok) return { items: [], source: "Local JSON" };
    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.matches || [];
    return { items: items.map(normalizeLocalMatch), source: "Local JSON" };
  } catch {
    return { items: [], source: "Local JSON" };
  }
}

function normalizeLocalMatch(match) {
  return {
    id: match.id || `${match.home}-${match.away}-${match.kickoff}`,
    home: match.home,
    away: match.away,
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    status: match.status || "NS",
    elapsed: match.elapsed ?? null,
    kickoff: match.kickoff,
    venue: match.venue || "",
    group: match.group || "",
    stage: match.stage || match.round || "",
    bracketSlot: match.bracketSlot ?? null,
    region: match.region || "",
    winner: match.winner || "",
    league: match.league || "World Cup",
  };
}

function render({ items, source }) {
  const now = new Date();
  const todaysMatches = items
    .filter((match) => isTodayWib(match.kickoff))
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const upcoming = items
    .filter((match) => !isFinished(match.status) && new Date(match.kickoff) >= now)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
    .slice(0, UPCOMING_LIMIT);
  const live = todaysMatches.filter((match) => isLive(match.status));
  const scored = items
    .filter(hasScore)
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));
  const featured = live.length ? live : scored;
  const visibleFeatured = featured.slice(0, FEATURED_SCORE_LIMIT);
  const headline = live.length ? "Live Score" : "Skor Terbaru";

  liveHeading.textContent = headline;
  liveMatches.innerHTML = visibleFeatured.length
    ? visibleFeatured.map(renderLiveCard).join("")
    : renderEmpty("Belum ada pertandingan live saat ini");

  scheduleMatches.innerHTML = upcoming.length
    ? upcoming.map(renderScheduleRow).join("")
    : renderEmpty("Belum ada jadwal berikutnya di data lokal");

  const bracketMatches = getRoundOf32(items);
  bracketBoard.innerHTML = renderBracket(bracketMatches);

  if (dataStatus) dataStatus.textContent = `${source}`;
  liveCount.textContent = live.length ? `${visibleFeatured.length} live` : `${visibleFeatured.length} skor`;
  scheduleCount.textContent = `${upcoming.length} berikutnya`;
  bracketCount.textContent = `${bracketMatches.length} laga`;
}

function renderLiveCard(match) {
  return `
    <article class="match-card">
      <div class="match-meta">
        <span class="${isLive(match.status) ? "live-dot" : "status-dot"}">${statusLabel(match)}</span>
        <span>${formatTime(match.kickoff)} WIB</span>
      </div>
      <div class="teams">
        <span class="team">
          <span class="team-flag">${teamInitial(match.home)}</span>
          <span class="team-name">${escapeHtml(match.home)}</span>
        </span>
        <strong class="score">${scoreText(match)}</strong>
        <span class="team away">
          <span class="team-name">${escapeHtml(match.away)}</span>
          <span class="team-flag">${teamInitial(match.away)}</span>
        </span>
      </div>
      <p class="match-note">${escapeHtml(match.group || match.league)} · ${escapeHtml(match.venue || "")}</p>
    </article>
  `;
}

function renderScheduleRow(match) {
  return `
    <article class="schedule-row">
      <strong class="kickoff">${formatTime(match.kickoff)}</strong>
      <div class="fixture">
        <span>${escapeHtml(match.home)}</span>
        <em>${scoreText(match)}</em>
        <span>${escapeHtml(match.away)}</span>
      </div>
      <div class="venue">
        <b>${statusLabel(match)}</b>
        <span>${escapeHtml(match.group || match.stage || match.venue || "")}</span>
      </div>
    </article>
  `;
}

function renderEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function getRoundOf32(matches) {
  return matches
    .filter((match) => (match.stage || "").toLowerCase().includes("round of 32") || match.bracketSlot)
    .sort((a, b) => Number(a.bracketSlot || 99) - Number(b.bracketSlot || 99));
}

function renderBracket(matches) {
  if (!matches.length) return renderEmpty("Belum ada data bagan fase gugur");

  const bySlot = new Map(matches.map((match) => [Number(match.bracketSlot), match]));
  const regionMarkup = BRACKET_REGIONS.map((region) => renderBracketRegion(region, bySlot)).join("");
  const winners = matches.map((match) => getWinner(match) || `Winner ${match.bracketSlot}`);

  return `
    <div class="bracket-regions">${regionMarkup}</div>
    <aside class="bracket-path">
      <div class="path-card">
        <span class="path-label">Jalur Berikutnya</span>
        <h3>16 Besar</h3>
        <div class="winner-grid">
          ${chunk(winners, 2).map((pair, index) => renderWinnerPair(pair, index + 1)).join("")}
        </div>
      </div>
      <div class="path-card final-card">
        <span class="path-label">Perempat Final · Semifinal · Final</span>
        <h3>Road to Final</h3>
        <p>Pemenang akan naik otomatis setelah skor pertandingan diisi.</p>
      </div>
    </aside>
  `;
}

function renderBracketRegion(region, bySlot) {
  return `
    <section class="bracket-region">
      <header>${escapeHtml(region.title)}</header>
      <div class="bracket-matches">
        ${region.slots.map((slot) => renderBracketMatch(bySlot.get(slot), slot)).join("")}
      </div>
    </section>
  `;
}

function renderBracketMatch(match, slot) {
  if (!match) {
    return `
      <article class="bracket-match is-empty">
        <span class="match-number">${slot}</span>
        <strong>Menunggu tim</strong>
      </article>
    `;
  }

  return `
    <article class="bracket-match ${isFinished(match.status) ? "is-finished" : ""}">
      <span class="match-number">${slot}</span>
      <div class="bracket-team ${getWinner(match) === match.home ? "winner" : ""}">
        <span>${teamInitial(match.home)}</span>
        <strong>${escapeHtml(match.home)}</strong>
      </div>
      <em>${scoreText(match)}</em>
      <div class="bracket-team ${getWinner(match) === match.away ? "winner" : ""}">
        <span>${teamInitial(match.away)}</span>
        <strong>${escapeHtml(match.away)}</strong>
      </div>
      <small>${formatTime(match.kickoff)} WIB · ${statusLabel(match)}</small>
    </article>
  `;
}

function renderWinnerPair(pair, index) {
  return `
    <article class="winner-pair">
      <span>R16-${index}</span>
      <strong>${escapeHtml(pair[0] || `Winner ${index * 2 - 1}`)}</strong>
      <em>vs</em>
      <strong>${escapeHtml(pair[1] || `Winner ${index * 2}`)}</strong>
    </article>
  `;
}

function getWinner(match) {
  if (!isFinished(match.status) || !hasScore(match)) return "";
  if (Number(match.homeScore) > Number(match.awayScore)) return match.home;
  if (Number(match.awayScore) > Number(match.homeScore)) return match.away;
  return match.winner || "";
}

function chunk(values, size) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, index * size + size),
  );
}

function isLive(status) {
  return ["1H", "2H", "ET", "BT", "P", "LIVE", "HT"].includes(status);
}

function isFinished(status) {
  return ["FT", "AET", "PEN"].includes(status);
}

function hasScore(match) {
  return match.homeScore !== null && match.awayScore !== null;
}

function statusLabel(match) {
  if (match.status === "NS") return "Belum mulai";
  if (match.status === "HT") return "Half-time";
  if (match.status === "FT") return "Selesai";
  if (match.elapsed) return `${match.elapsed}'`;
  return match.status || "Live";
}

function scoreText(match) {
  const home = match.homeScore ?? "-";
  const away = match.awayScore ?? "-";
  return `${home} : ${away}`;
}

function teamInitial(name) {
  return escapeHtml(
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  );
}

function isTodayWib(value) {
  return dateKey(new Date(value), WIB_TIMEZONE) === dateKey(new Date(), WIB_TIMEZONE);
}

function dateKey(date, timeZone = undefined) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function nextDateKeys(days) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + index);
    return dateKey(date, WIB_TIMEZONE);
  });
}

function formatTime(value) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: WIB_TIMEZONE,
  })
    .format(new Date(value))
    .replace(".", ":");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
