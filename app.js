const AUTHOR_NAME = "@userluke_";                  // da sostituire
const AUTHOR_URL = "https://x.com/userluke_";       // da sostituire
const PART1_URL = "https://userman12.github.io/internet-adoption-map";

/* global d3, topojson (loaded as classic scripts from cdnjs) */

// Eurostat countries in isoc_eb_ai -> world-atlas numeric id (ISO 3166-1 numeric).
// Membership in this table is what makes a country "covered" (No data vs plain land).
const NUM = {
  AT: "040", BE: "056", BG: "100", HR: "191", CY: "196", CZ: "203", DK: "208", EE: "233", FI: "246",
  FR: "250", DE: "276", GR: "300", HU: "348", IE: "372", IT: "380", LV: "428", LT: "440", LU: "442",
  MT: "470", NL: "528", PL: "616", PT: "620", RO: "642", SK: "703", SI: "705", ES: "724", SE: "752",
  NO: "578", BA: "070", ME: "499", MK: "807", AL: "008", RS: "688", TR: "792",
};
const EU = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" "));
const BINS = [10, 20, 30, 40]; // fixed for every year and size, so change over time is visible
const STEP_MS = 1500;

const T = {
  en: {
    eyebrow: "AI in European business · Eurostat",
    title: "How fast is AI spreading through European businesses?",
    sub: "Share of enterprises (10+ employees) using at least one AI technology. Source: Eurostat.",
    year: "Year", size: "Company size", play: "Play", pause: "Pause",
    sizes: { all: "All", small: "Small", medium: "Medium", large: "Large" },
    sizeLong: { all: "all enterprises", small: "small enterprises", medium: "medium enterprises", large: "large enterprises" },
    eu: "EU27", euAvg: "EU27 average", vs: "vs", pp: "pp", nonEU: "non-EU", noData: "No data",
    in: "in", note: "Eurostat note", noDataFor: (y) => `No data for ${y}:`, flagFoot: "* Eurostat note, see the map tooltip.",
    ranking: "Ranking", mapLabel: "Map of Europe, coloured by share of enterprises using AI. Tab through countries to read values.",
    legend: "Share of enterprises", seriesKicker: "Part 2 of a series",
    seriesText: "Part 1 showed how long it took each country to go from 10% to 50% of people online. This one shows where businesses stand with AI.",
    seriesLink: "See Part 1 →", source: "Source:", dataset: "dataset", extracted: "extracted",
    builtBy: "Built by", privacy: "No data is collected from visitors.",
    flags: { b: "Break in series", u: "Low reliability", bu: "Break in series, low reliability", d: "Definition differs", e: "Estimate", p: "Provisional", c: "Confidential" },
  },
  it: {
    eyebrow: "L'AI nelle imprese europee · Eurostat",
    title: "Quanto velocemente si diffonde l'AI nelle imprese europee?",
    sub: "Quota di imprese (10+ addetti) che usano almeno una tecnologia di AI. Fonte: Eurostat.",
    year: "Anno", size: "Dimensione d'impresa", play: "Riproduci", pause: "Pausa",
    sizes: { all: "Tutte", small: "Piccole", medium: "Medie", large: "Grandi" },
    sizeLong: { all: "tutte le imprese", small: "piccole imprese", medium: "medie imprese", large: "grandi imprese" },
    eu: "UE27", euAvg: "Media UE27", vs: "rispetto al", pp: "p.p.", nonEU: "extra-UE", noData: "Nessun dato",
    in: "nel", note: "Nota Eurostat", noDataFor: (y) => `Nessun dato per il ${y}:`, flagFoot: "* Nota Eurostat, vedi il dettaglio sulla mappa.",
    ranking: "Classifica", mapLabel: "Mappa dell'Europa colorata per quota di imprese che usano l'AI. Usa Tab per leggere i valori dei paesi.",
    legend: "Quota di imprese", seriesKicker: "Seconda puntata di una serie",
    seriesText: "La prima puntata mostrava quanto ha impiegato ogni paese a passare dal 10% al 50% di persone online. Questa mostra a che punto sono le imprese con l'AI.",
    seriesLink: "Vedi la prima puntata →", source: "Fonte:", dataset: "dataset", extracted: "estratto il",
    builtBy: "Realizzato da", privacy: "Nessun dato viene raccolto dai visitatori.",
    flags: { b: "Interruzione di serie", u: "Bassa affidabilità", bu: "Interruzione di serie, bassa affidabilità", d: "Definizione diversa", e: "Stima", p: "Provvisorio", c: "Riservato" },
  },
};
const SIZE_RANGE = { all: "10+", small: "10-49", medium: "50-249", large: "250+" };

const $ = (id) => document.getElementById(id);
const [data, world] = await Promise.all([
  d3.json("data/ai-adoption.json"),
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
]);
const YEARS = data.years.map(String);
const covered = Object.keys(NUM);
const byNum = Object.fromEntries(covered.map((c) => [NUM[c], c]));
const val = (c, s, y) => data.values[c]?.[s]?.[y];
const flag = (c, s, y) => data.flags[c]?.[s]?.[y];
const prevYear = (y) => YEARS[YEARS.indexOf(y) - 1];
const allVals = Object.values(data.values).flatMap((s) => Object.values(s).flatMap(Object.values));
const BAR_MAX = Math.ceil(Math.max(...allVals) / 10) * 10;
const bin = (v) => BINS.filter((t) => v >= t).length;
// round half up on the decimal value (19.95 -> 20.0, as Eurostat publishes), not on its binary float
const r1 = (v) => Math.round(Number((v * 10).toPrecision(12))) / 10;

// ---- state <-> hash ----
const state = { y: YEARS.at(-1), s: "all", l: "en" };
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  state.y = YEARS.includes(p.get("y")) ? p.get("y") : YEARS.at(-1);
  state.s = p.get("s") in SIZE_RANGE ? p.get("s") : "all";
  state.l = p.get("l") === "it" ? "it" : "en";
}
const writeHash = () => history.replaceState(null, "", `#y=${state.y}&s=${state.s}${state.l === "it" ? "&l=it" : ""}`);

// language-dependent helpers, rebuilt on language change
let t, name, pct, pp, flagText;
function setLang(l) {
  t = T[l];
  const dn = new Intl.DisplayNames([l], { type: "region" });
  const nf = new Intl.NumberFormat(l, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  name = (c) => dn.of(c);
  pct = (v) => `${nf.format(r1(v))}%`;
  pp = (d) => `${d >= 0 ? "+" : "−"}${nf.format(r1(Math.abs(d)))} ${t.pp}`;
  flagText = (f) => t.flags[f] ?? data.flagLabels[f] ?? f;
  document.documentElement.lang = l;
  document.title = l === "it" ? "Mappa dell'adozione dell'AI" : "AI Adoption Map";
  document.querySelectorAll("[data-i18n]").forEach((e) => (e.textContent = t[e.dataset.i18n]));
  document.querySelectorAll("#sizes button").forEach((b) =>
    (b.innerHTML = `${t.sizes[b.dataset.s]}<small>${SIZE_RANGE[b.dataset.s]}</small>`));
  svg.attr("aria-label", t.mapLabel);
  const labels = ["<10", "10–20", "20–30", "30–40", "40+"];
  $("legend").innerHTML = `<span>${t.legend}</span><span class="scale">` +
    labels.map((x, i) => `<span><i style="background:var(--b${i})"></i>${x}%</span>`).join("") +
    `</span><span class="nd"><i></i>${t.noData}</span>`;
}

// ---- static chrome ----
$("part1").href = PART1_URL;
Object.assign($("author"), { href: AUTHOR_URL, textContent: AUTHOR_NAME });
$("srcLink").href = data.sourceUrl;
$("extracted").textContent = data.extractedAt;
$("years").innerHTML = YEARS.map((y) =>
  `<button data-y="${y}"><span class="yv"></span><span class="col"></span><span class="yl">${y}</span></button>`).join("");

// ---- map ----
const W = 600, H = 620;
const svg = d3.select("#map");
svg.append("defs").append("pattern").attr("id", "hatch").attr("width", 5).attr("height", 5)
  .attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)")
  .call((p) => { p.append("rect").attr("class", "hatch-bg").attr("width", 5).attr("height", 5);
                 p.append("line").attr("class", "hatch-line").attr("y2", 5); });
const projection = d3.geoAzimuthalEqualArea().rotate([-14, -52]).clipAngle(50)
  .fitExtent([[8, 8], [W - 8, H - 8]], { type: "MultiPoint", coordinates: [[-10, 36], [33, 35], [44, 41], [30, 70], [-9, 62], [5, 71]] });
const path = d3.geoPath(projection);
const feats = topojson.feature(world, world.objects.countries).features;
const isCovered = (f) => byNum[f.id];
svg.append("g").selectAll("path").data(feats.filter((f) => !isCovered(f))).join("path").attr("class", "land").attr("d", path);
const ctry = svg.append("g").selectAll("path").data(feats.filter(isCovered)).join("path")
  .attr("class", "ctry").attr("d", path).attr("tabindex", 0).attr("role", "img");

// ---- tooltip ----
const wrap = document.querySelector(".mapwrap"), tip = $("tip");
function tipHtml(c) {
  const { y, s } = state, v = val(c, s, y);
  const tag = EU.has(c) ? "" : `<span class="tag">${t.nonEU}</span>`;
  if (v == null) return `<b>${name(c)}</b>${tag}<br><span class="m">${t.noData}</span>`;
  const py = prevYear(y), pv = py && val(c, s, py), f = flag(c, s, y);
  return `<b>${name(c)}</b>${tag}<span class="v">${pct(v)}</span><span class="m">${t.sizeLong[s]}, ${y}</span>` +
    (pv != null && py ? `<br>${pp(v - pv)} ${t.vs} ${py}` : "") +
    (f ? `<br><span class="m">${t.note}: ${flagText(f)}</span>` : "");
}
let tipFor = null;
function showTip(c, x, y) {
  tipFor = c;
  tip.innerHTML = tipHtml(c);
  tip.hidden = false;
  const r = wrap.getBoundingClientRect();
  const left = Math.min(Math.max(x + 12, 4), r.width - tip.offsetWidth - 4);
  const top = y + 16 + tip.offsetHeight > r.height ? y - tip.offsetHeight - 12 : y + 16;
  Object.assign(tip.style, { left: `${left}px`, top: `${Math.max(top, 4)}px` });
}
const hideTip = () => { tipFor = null; tip.hidden = true; };
const local = (e) => { const r = wrap.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
ctry
  .on("pointermove pointerdown", (e, f) => showTip(byNum[f.id], ...local(e)))
  .on("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); })
  .on("focus", (e, f) => {
    const k = wrap.getBoundingClientRect().width / W, [cx, cy] = path.centroid(f);
    showTip(byNum[f.id], cx * k, cy * k);
  })
  .on("blur", hideTip);
svg.on("pointerdown", (e) => { if (!e.target.classList.contains("ctry")) hideTip(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTip(); });

// ---- render ----
function render() {
  const { y, s, l } = state;
  const fill = (c) => { const v = val(c, s, y); return v == null ? "url(#hatch)" : `var(--b${bin(v)})`; };
  ctry.style("fill", (f) => fill(byNum[f.id]))
    .attr("aria-label", (f) => { const c = byNum[f.id], v = val(c, s, y);
      return `${name(c)}${EU.has(c) ? "" : ` (${t.nonEU})`}: ${v == null ? t.noData : pct(v)}`; });
  if (tipFor) tip.innerHTML = tipHtml(tipFor);

  // headline
  const eu = val("EU27", s, y), py = prevYear(y), peu = py && val("EU27", s, py);
  $("heroNum").textContent = eu == null ? t.noData : pct(eu);
  $("heroLabel").textContent = `${t.eu} · ${t.sizeLong[s]} · ${y}`;
  $("heroDelta").innerHTML = eu != null && peu != null ? `<b>${pp(eu - peu)}</b> ${t.vs} ${py}` : "";

  // year selector = EU27 trend for the selected size
  // bars share a scale within the selected size, so the trend's shape is what reads
  const euMax = Math.max(...YEARS.map((yy) => val("EU27", s, yy) ?? 0));
  document.querySelectorAll("#years button").forEach((b) => {
    const yy = b.dataset.y, v = val("EU27", s, yy);
    b.setAttribute("aria-pressed", yy === y);
    b.setAttribute("aria-label", `${yy}, ${t.eu} ${v == null ? t.noData : pct(v)}`);
    b.querySelector(".yv").textContent = v == null ? "–" : pct(v);
    b.querySelector(".col").style.height = `${v == null ? 0 : Math.max(2, (v / euMax) * 64)}px`;
  });
  document.querySelectorAll("#sizes button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.s === s));
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.l === l));
  $("play").textContent = timer ? `❚❚ ${t.pause}` : `▶ ${t.play}`;

  // ranking
  const rows = covered.filter((c) => val(c, s, y) != null).sort((a, b) => val(b, s, y) - val(a, s, y));
  const euMark = eu == null ? "" : `<span class="eu" style="left:${(eu / BAR_MAX) * 100}%"></span>`;
  $("rankTitle").textContent = `${t.ranking} · ${t.sizeLong[s]} · ${y}`;
  $("rankList").innerHTML =
    (eu == null ? "" : `<li class="euref"><span class="n"></span><span class="nm"><i class="eu-dot"></i><span>${t.euAvg}</span></span><span class="bar">${euMark}</span><span class="val">${pct(eu)}</span></li>`) +
    rows.map((c, i) => { const v = val(c, s, y), f = flag(c, s, y);
      return `<li><span class="n">${i + 1}</span>` +
        `<span class="nm"><span>${name(c)}</span>${EU.has(c) ? "" : `<span class="tag">${t.nonEU}</span>`}</span>` +
        `<span class="bar"><i style="width:${(v / BAR_MAX) * 100}%"></i>${euMark}</span>` +
        `<span class="val">${pct(v)}${f ? `<abbr title="${t.note}: ${flagText(f)}">*</abbr>` : ""}</span></li>`; }).join("");
  const missing = covered.filter((c) => val(c, s, y) == null).map(name);
  $("missing").textContent = [missing.length ? `${t.noDataFor(y)} ${missing.join(", ")}.` : "",
    rows.some((c) => flag(c, s, y)) ? t.flagFoot : ""].filter(Boolean).join(" ");
}

// ---- controls ----
let timer = null;
function stop() { clearInterval(timer); timer = null; $("play").setAttribute("aria-pressed", false); render(); }
function set(patch) { Object.assign(state, patch); writeHash(); render(); }
$("years").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { if (timer) stop(); set({ y: b.dataset.y }); } });
$("sizes").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set({ s: b.dataset.s }); });
document.querySelector(".lang").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (b) { setLang(b.dataset.l); set({ l: b.dataset.l }); } });
$("play").addEventListener("click", () => {
  if (timer) return stop();
  $("play").setAttribute("aria-pressed", true);
  timer = setInterval(() => {
    const i = YEARS.indexOf(state.y);
    if (i >= YEARS.length - 1) return stop();
    set({ y: YEARS[i + 1] });
    if (i + 1 === YEARS.length - 1) stop();
  }, STEP_MS);
  if (state.y === YEARS.at(-1)) set({ y: YEARS[0] }); else render();
});
addEventListener("hashchange", () => { readHash(); setLang(state.l); render(); });

readHash();
setLang(state.l);
render();
