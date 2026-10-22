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
const STEP_MS = 1500;

// Indicator groups, in display order. "base" = what the percentage is a share of.
const GROUPS = [
  { id: "adoption", base: "share", items: ["any", "tge2", "tge3"] },
  { id: "tech", base: "share", items: ["tnlg", "ttm", "tsr", "tpvsg", "tpa", "tml", "tir", "tar"] },
  { id: "purpose", base: "users", items: ["pms", "pbam", "pfin", "ppp", "pits", "prdi", "plog"] },
  { id: "barrier", base: "considered", items: ["ble", "bleg", "bcdp", "bddt", "binc", "bcst", "bec", "bnu"] },
];
const IND = Object.fromEntries(GROUPS.flatMap((g) => g.items.map((k) => [k, g])));

const T = {
  en: {
    title: "How fast is AI spreading through European businesses?",
    sub: "Share of enterprises (10+ employees) using at least one AI technology. Source: Eurostat.",
    year: "Year", size: "Company size", indicator: "Indicator", view: "View", map: "Map", globe: "Globe",
    play: "Play", pause: "Pause",
    sizes: { all: "All", small: "Small", medium: "Medium", large: "Large" },
    sizeLong: { all: "all enterprises", small: "small enterprises", medium: "medium enterprises", large: "large enterprises" },
    eu: "EU27", euAvg: "EU27 average", vs: "vs", pp: "pp", nonEU: "non-EU", noData: "No data",
    note: "Eurostat note", noDataFor: (y) => `No data for ${y}:`, flagFoot: "* Eurostat note, see the map tooltip.",
    ranking: "Ranking", hint: "Select a country for its full profile.", back: "← Ranking", close: "Back to ranking",
    notSurveyed: (y) => `No data for ${y}.`, rank: "Rank",
    mapLabel: "Map of Europe, coloured by the selected indicator. Tab through countries to read values, Enter opens the country profile.",
    globeLabel: "Globe centred on Europe, coloured by the selected indicator. Drag to rotate.",
    seriesKicker: "Part 2 of a series",
    seriesText: "Part 1 showed how long it took each country to go from 10% to 50% of people online. This one shows where businesses stand with AI.",
    seriesLink: "See Part 1 →", source: "Source:", dataset: "dataset", extracted: "extracted",
    builtBy: "Built by", privacy: "No data is collected from visitors.", toDark: "Switch to dark theme", toLight: "Switch to light theme",
    flags: { b: "Break in series", u: "Low reliability", bu: "Break in series, low reliability", d: "Definition differs", e: "Estimate", p: "Provisional", c: "Confidential" },
    groups: { adoption: "Adoption", tech: "Technologies", purpose: "What AI is used for", barrier: "Why non-users hold back" },
    base: { share: "% of enterprises", users: "% of enterprises using AI", considered: "% of enterprises that considered AI but don't use it" },
    ind: {
      any: "Uses at least one AI technology", tge2: "Uses 2+ AI technologies", tge3: "Uses 3+ AI technologies",
      tnlg: "Text, speech or code generation", ttm: "Text analysis", tsr: "Speech recognition",
      tpvsg: "Image, video or audio generation", tpa: "Workflow automation (RPA)", tml: "Machine learning for data analysis",
      tir: "Image recognition", tar: "Autonomous robots, vehicles or drones",
      pms: "Marketing or sales", pbam: "Business administration or management", pfin: "Accounting, controlling or finance",
      ppp: "Production processes", pits: "ICT security", prdi: "R&D or innovation", plog: "Logistics",
      ble: "Lack of expertise", bleg: "Unclear legal consequences", bcdp: "Data protection and privacy concerns",
      bddt: "Data availability or quality", binc: "Incompatible with existing systems", bcst: "Costs too high",
      bec: "Ethical considerations", bnu: "Not useful for the business",
    },
  },
  it: {
    title: "Quanto velocemente si diffonde l'AI nelle imprese europee?",
    sub: "Quota di imprese (10+ addetti) che usano almeno una tecnologia di AI. Fonte: Eurostat.",
    year: "Anno", size: "Dimensione d'impresa", indicator: "Indicatore", view: "Vista", map: "Mappa", globe: "Globo",
    play: "Riproduci", pause: "Pausa",
    sizes: { all: "Tutte", small: "Piccole", medium: "Medie", large: "Grandi" },
    sizeLong: { all: "tutte le imprese", small: "piccole imprese", medium: "medie imprese", large: "grandi imprese" },
    eu: "UE27", euAvg: "Media UE27", vs: "rispetto al", pp: "p.p.", nonEU: "extra-UE", noData: "Nessun dato",
    note: "Nota Eurostat", noDataFor: (y) => `Nessun dato per il ${y}:`, flagFoot: "* Nota Eurostat, vedi il dettaglio sulla mappa.",
    ranking: "Classifica", hint: "Seleziona un paese per la scheda completa.", back: "← Classifica", close: "Torna alla classifica",
    notSurveyed: (y) => `Nessun dato per il ${y}.`, rank: "Posizione",
    mapLabel: "Mappa dell'Europa colorata secondo l'indicatore scelto. Usa Tab per leggere i valori, Invio apre la scheda del paese.",
    globeLabel: "Globo centrato sull'Europa, colorato secondo l'indicatore scelto. Trascina per ruotarlo.",
    seriesKicker: "Seconda puntata di una serie",
    seriesText: "La prima puntata mostrava quanto ha impiegato ogni paese a passare dal 10% al 50% di persone online. Questa mostra a che punto sono le imprese con l'AI.",
    seriesLink: "Vedi la prima puntata →", source: "Fonte:", dataset: "dataset", extracted: "estratto il",
    builtBy: "Realizzato da", privacy: "Nessun dato viene raccolto dai visitatori.", toDark: "Passa al tema scuro", toLight: "Passa al tema chiaro",
    flags: { b: "Interruzione di serie", u: "Bassa affidabilità", bu: "Interruzione di serie, bassa affidabilità", d: "Definizione diversa", e: "Stima", p: "Provvisorio", c: "Riservato" },
    groups: { adoption: "Adozione", tech: "Tecnologie", purpose: "Per cosa si usa l'AI", barrier: "Perché chi non la usa si frena" },
    base: { share: "% delle imprese", users: "% delle imprese che usano l'AI", considered: "% delle imprese che hanno valutato l'AI ma non la usano" },
    ind: {
      any: "Usa almeno una tecnologia di AI", tge2: "Usa 2+ tecnologie di AI", tge3: "Usa 3+ tecnologie di AI",
      tnlg: "Generazione di testo, voce o codice", ttm: "Analisi del testo", tsr: "Riconoscimento vocale",
      tpvsg: "Generazione di immagini, video o audio", tpa: "Automazione dei processi (RPA)", tml: "Machine learning per l'analisi dei dati",
      tir: "Riconoscimento di immagini", tar: "Robot, veicoli o droni autonomi",
      pms: "Marketing o vendite", pbam: "Amministrazione o gestione", pfin: "Contabilità, controllo o finanza",
      ppp: "Processi produttivi", pits: "Sicurezza informatica", prdi: "R&S o innovazione", plog: "Logistica",
      ble: "Mancanza di competenze", bleg: "Conseguenze legali poco chiare", bcdp: "Timori su protezione dei dati e privacy",
      bddt: "Disponibilità o qualità dei dati", binc: "Incompatibilità con i sistemi esistenti", bcst: "Costi troppo alti",
      bec: "Considerazioni etiche", bnu: "Non utile per l'impresa",
    },
  },
};
const SIZE_RANGE = { all: "10+", small: "10-49", medium: "50-249", large: "250+" };

const $ = (id) => document.getElementById(id);
const [data, world] = await Promise.all([
  d3.json("data/ai-adoption.json"),
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
]);
const covered = Object.keys(NUM);
const byNum = Object.fromEntries(covered.map((c) => [NUM[c], c]));
const ALL_YEARS = [...new Set([data.years, ...Object.values(data.more).map((m) => m.years)].flat())].sort().map(String);

const src = (i) => (i === "any" ? data : data.more[i]);
const val = (i, c, s, y) => src(i).values[c]?.[s]?.[y];
const flag = (i, c, s, y) => src(i).flags[c]?.[s]?.[y];
const yearsOf = (i) => src(i).years.map(String);
const prevYear = (i, y) => { const ys = yearsOf(i); return ys[ys.indexOf(y) - 1]; };
// round half up on the decimal value (19.95 -> 20.0, as Eurostat publishes), not on its binary float
const r1 = (v) => Math.round(Number((v * 10).toPrecision(12))) / 10;

// Colour bins per indicator: four equal "nice" steps sized on the all-enterprises country values,
// fixed across years and sizes so change is visible. For the headline indicator this gives 10/20/30/40.
const NICE = [1, 2, 2.5, 5, 10, 20, 25];
const scales = {};
function scaleOf(i) {
  if (scales[i]) return scales[i];
  const v = src(i).values;
  const allSize = covered.flatMap((c) => Object.values(v[c]?.all ?? {}));
  const every = Object.values(v).flatMap((s) => Object.values(s).flatMap(Object.values));
  const step = NICE.find((n) => n >= Math.max(...allSize) / 5) ?? 25;
  return (scales[i] = { bins: [1, 2, 3, 4].map((k) => k * step), max: Math.ceil(Math.max(...every) / step) * step });
}
const bin = (i, v) => scaleOf(i).bins.filter((b) => v >= b).length;

// ---- state <-> hash ----
const VIEWS = ["map", "globe"];
const state = { y: ALL_YEARS.at(-1), s: "all", l: "en", i: "any", v: "map", c: null };
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  state.i = p.get("i") in IND ? p.get("i") : "any";
  state.y = yearsOf(state.i).includes(p.get("y")) ? p.get("y") : yearsOf(state.i).at(-1);
  state.s = p.get("s") in SIZE_RANGE ? p.get("s") : "all";
  state.l = p.get("l") === "it" ? "it" : "en";
  state.v = VIEWS.includes(p.get("v")) ? p.get("v") : "map";
  state.c = covered.includes(p.get("c")) ? p.get("c") : null;
}
function writeHash() {
  const { y, s, l, i, v, c } = state;
  const extra = [i !== "any" && `i=${i}`, v !== "map" && `v=${v}`, c && `c=${c}`, l === "it" && "l=it"].filter(Boolean);
  history.replaceState(null, "", `#${[`y=${y}`, `s=${s}`, ...extra].join("&")}`);
}

// language-dependent helpers, rebuilt on language change
let t, name, pct, pp, flagText, num;
function setLang(l) {
  t = T[l];
  const dn = new Intl.DisplayNames([l], { type: "region" });
  const nf = new Intl.NumberFormat(l, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  num = new Intl.NumberFormat(l, { maximumFractionDigits: 1 }).format;
  name = (c) => dn.of(c);
  pct = (v) => `${nf.format(r1(v))}%`;
  pp = (d) => `${d >= 0 ? "+" : "−"}${nf.format(r1(Math.abs(d)))} ${t.pp}`;
  flagText = (f) => t.flags[f] ?? data.flagLabels[f] ?? f;
  document.documentElement.lang = l;
  document.title = l === "it" ? "Mappa dell'adozione dell'AI" : "AI Adoption Map";
  document.querySelectorAll("[data-i18n]").forEach((e) => (e.textContent = t[e.dataset.i18n]));
  document.querySelectorAll("#sizes button").forEach((b) =>
    (b.innerHTML = `${t.sizes[b.dataset.s]}<small>${SIZE_RANGE[b.dataset.s]}</small>`));
  document.querySelectorAll("#views button").forEach((b) => (b.textContent = t[b.dataset.v]));
  syncTheme();
  $("ind").innerHTML = GROUPS.map((g) => `<optgroup label="${t.groups[g.id]}">` +
    g.items.map((k) => `<option value="${k}">${t.ind[k]}</option>`).join("") + "</optgroup>").join("");
}

// ---- theme: the head script sets data-theme before first paint ----
const root = document.documentElement, systemDark = matchMedia("(prefers-color-scheme: dark)");
function syncTheme() {
  const label = root.dataset.theme === "dark" ? t.toLight : t.toDark;
  Object.assign($("theme"), { title: label, ariaLabel: label });
}
$("theme").addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  syncTheme();
});
systemDark.addEventListener("change", (e) => { // follow the system until the visitor picks a theme
  let saved = null; try { saved = localStorage.getItem("theme"); } catch {}
  if (!saved) { root.dataset.theme = e.matches ? "dark" : "light"; syncTheme(); }
});

// ---- static chrome ----
$("part1").href = PART1_URL;
Object.assign($("author"), { href: AUTHOR_URL, textContent: AUTHOR_NAME });
$("srcLink").href = data.sourceUrl;
$("extracted").textContent = data.extractedAt;
$("years").innerHTML = ALL_YEARS.map((y) =>
  `<button data-y="${y}"><span class="yv"></span><span class="col"></span><span class="yl">${y}</span></button>`).join("");

// ---- motion ----
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DUR = reduced ? 0 : 550;
const ROW = 21; // ranking row height, px

// ---- map / globe ----
const W = 600, H = 620;
const svg = d3.select("#map");
const defs = svg.append("defs");
defs.append("pattern").attr("id", "hatch").attr("width", 5).attr("height", 5)
  .attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)")
  .call((p) => { p.append("rect").attr("class", "hatch-bg").attr("width", 5).attr("height", 5);
                 p.append("line").attr("class", "hatch-line").attr("y2", 5); });
// limb shading: transparent centre, darker rim, so the sphere reads as 3D
defs.append("radialGradient").attr("id", "limb").attr("cx", "42%").attr("cy", "38%").attr("r", "62%")
  .selectAll("stop").data([[0, 0], [0.75, 0.1], [1, 0.32]]).join("stop")
  .attr("offset", (d) => d[0]).attr("class", "limb-stop").attr("stop-opacity", (d) => d[1]);

const EUROPE = { type: "MultiPoint", coordinates: [[-10, 36], [33, 35], [44, 41], [30, 70], [-9, 62], [5, 71]] };
const mapProj = d3.geoAzimuthalEqualArea().rotate([-14, -52]).clipAngle(50).fitExtent([[8, 8], [W - 8, H - 8]], EUROPE);
const HOME = [-14, -50];
const globeProj = d3.geoOrthographic().rotate(HOME).clipAngle(90).fitExtent([[18, 18], [W - 18, H - 18]], { type: "Sphere" });
globeProj.scale(globeProj.scale() * 1.25); // a bit closer: Europe fills more of the frame, the rim stays visible
const path = d3.geoPath(mapProj);
const feats = topojson.feature(world, world.objects.countries).features;
const isCovered = (f) => byNum[f.id];
const sphere = svg.append("path").datum({ type: "Sphere" }).attr("class", "sphere");
const grat = svg.append("path").datum(d3.geoGraticule10()).attr("class", "graticule");
const land = svg.append("g").selectAll("path").data(feats.filter((f) => !isCovered(f))).join("path").attr("class", "land");
const ctry = svg.append("g").selectAll("path").data(feats.filter(isCovered)).join("path")
  .attr("class", "ctry").attr("tabindex", 0).attr("role", "button");
const limb = svg.append("path").datum({ type: "Sphere" }).attr("class", "limb").attr("fill", "url(#limb)");
function draw() {
  const globe = state.v === "globe";
  path.projection(globe ? globeProj : mapProj);
  for (const sel of [sphere, grat, limb]) sel.attr("display", globe ? null : "none").attr("d", path);
  land.attr("d", path);
  ctry.attr("d", path);
}
let drawQueued = false;
const queueDraw = () => { if (!drawQueued) { drawQueued = true; requestAnimationFrame(() => { drawQueued = false; draw(); }); } };
// ponytail: redraws all 50m paths per frame while dragging; switch to the 110m atlas during drag if phones stutter
svg.call(d3.drag().filter((e) => state.v === "globe" && !e.button)
  .on("start", () => { hideTip(); svg.classed("dragging", true); })
  .on("drag", (e) => { const [l, p] = globeProj.rotate(); globeProj.rotate([l + e.dx * 0.3, Math.max(-90, Math.min(90, p - e.dy * 0.3))]); queueDraw(); })
  .on("end", () => svg.classed("dragging", false)));
function spinIn() { // short turn from the Atlantic onto Europe when the globe opens
  if (!DUR) { globeProj.rotate(HOME); return draw(); }
  const from = [HOME[0] + 70, HOME[1] + 20];
  d3.select({}).transition().duration(1100).ease(d3.easeCubicOut)
    .tween("spin", () => { const r = d3.interpolate(from, HOME); return (k) => { globeProj.rotate(r(k)); draw(); }; });
}

// ---- tooltip + linked highlight (map <-> ranking) ----
const wrap = document.querySelector(".mapwrap"), tip = $("tip");
let rows = []; // countries with a value, sorted desc, for the current view
const cap = (x) => x[0].toUpperCase() + x.slice(1);
function tipHtml(c) {
  const { y, s, i } = state, v = val(i, c, s, y);
  const tag = EU.has(c) ? "" : `<span class="tag">${t.nonEU}</span>`;
  const head = `<span class="m ind">${t.ind[i]}</span><b>${name(c)}</b>${tag}`;
  if (v == null) return `${head}<br><span class="m">${t.noData}</span>`;
  const py = prevYear(i, y), pv = py && val(i, c, s, py), f = flag(i, c, s, y);
  return `${head}<span class="v">${pct(v)}</span><span class="m">${t.sizeLong[s]}, ${y} · ${rows.indexOf(c) + 1}/${rows.length}</span>` +
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
function highlight(c) {
  ctry.classed("hl", (f) => byNum[f.id] === c);
  d3.selectAll("#rankList li").classed("hl", (d) => d === c);
}
const hideTip = () => { tipFor = null; tip.hidden = true; highlight(null); };
const local = (e) => { const r = wrap.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
function tipAtCountry(c) {
  const f = ctry.data().find((g) => byNum[g.id] === c), [cx, cy] = path.centroid(f);
  if (Number.isNaN(cx)) return; // on the far side of the globe
  const k = wrap.getBoundingClientRect().width / W;
  showTip(c, cx * k, cy * k); highlight(c);
}
function openCountry(c) {
  set({ c });
  if (matchMedia("(max-width: 919px)").matches) { hideTip(); $("rank").scrollIntoView({ behavior: DUR ? "smooth" : "auto", block: "start" }); }
}
ctry
  .on("pointermove", (e, f) => { if (!svg.classed("dragging")) { showTip(byNum[f.id], ...local(e)); highlight(byNum[f.id]); } })
  .on("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); })
  .on("click", (e, f) => openCountry(byNum[f.id]))
  .on("keydown", (e, f) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCountry(byNum[f.id]); } })
  .on("focus", (e, f) => tipAtCountry(byNum[f.id]))
  .on("blur", hideTip);
svg.on("pointerdown", (e) => { if (!e.target.classList.contains("ctry")) hideTip(); });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (tipFor) hideTip(); else if (state.c) set({ c: null });
});
// hovering a ranking row points at the country on the map (mouse only; on touch the list is just a list)
d3.select("#rankList")
  .on("pointerover", (e) => { const li = e.target.closest("li"); if (li && e.pointerType === "mouse") tipAtCountry(d3.select(li).datum()); })
  .on("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); })
  .on("click", (e) => { const li = e.target.closest("li"); if (li) openCountry(d3.select(li).datum()); });

// ---- country profile ----
function profileHtml(c) {
  const { y, s, i } = state;
  const v = val(i, c, s, y), eu = val(i, "EU27", s, y);
  const tag = EU.has(c) ? "" : `<span class="tag">${t.nonEU}</span>`;
  const head = `<div class="cp-head"><button class="back" id="back" aria-label="${t.close}">${t.back}</button>` +
    `<p class="cp-sub">${cap(t.sizeLong[s])} · ${y}</p></div>` +
    `<h2 class="cp-name" id="cpName" tabindex="-1">${name(c)}${tag}</h2>` +
    `<div class="cp-hero"><p class="cp-ind">${t.ind[i]}</p><p class="cp-num">${v == null ? t.noData : pct(v)}</p>` +
    `<p class="cp-cmp">${[eu != null && `${t.euAvg} <b>${pct(eu)}</b>`, v != null && `${t.rank} <b>${rows.indexOf(c) + 1}/${rows.length}</b>`].filter(Boolean).join(" · ")}</p></div>`;
  const sections = GROUPS.map((g) => {
    // highest first; no data at the bottom, ties broken by EU27 value
    const items = g.items.filter((k) => yearsOf(k).includes(y))
      .sort((a, b) => (val(b, c, s, y) ?? -1) - (val(a, c, s, y) ?? -1) || (val(b, "EU27", s, y) ?? -1) - (val(a, "EU27", s, y) ?? -1));
    const vals = items.flatMap((k) => [val(k, c, s, y), val(k, "EU27", s, y)]).filter((x) => x != null);
    if (!vals.length) return `<section class="cp-sec"><h3>${t.groups[g.id]}</h3><p class="note">${t.notSurveyed(y)}</p></section>`;
    const max = Math.ceil(Math.max(...vals) / 10) * 10;
    return `<section class="cp-sec"><h3>${t.groups[g.id]}</h3><p class="cp-base">${t.base[g.base]}</p><ul>` + items.map((k) => {
      const cv = val(k, c, s, y), ev = val(k, "EU27", s, y), f = flag(k, c, s, y);
      return `<li><button class="prow" data-i="${k}" aria-current="${k === i}" aria-label="${t.ind[k]}: ${cv == null ? t.noData : pct(cv)}${ev == null ? "" : `, ${t.eu} ${pct(ev)}`}">` +
        `<span class="pl">${t.ind[k]}</span><span class="bar">${cv == null ? "" : `<i style="width:${(cv / max) * 100}%"></i>`}` +
        `${ev == null ? "" : `<span class="eu" style="left:${(ev / max) * 100}%"></span>`}</span>` +
        `<span class="val">${cv == null ? "–" : pct(cv)}${f ? `<abbr title="${t.note}: ${flagText(f)}">*</abbr>` : ""}</span></button></li>`;
    }).join("") + "</ul></section>";
  }).join("");
  return head + sections + `<p class="note cp-key"><i class="eu-tick"></i>${t.euAvg}</p>`;
}
$("profile").addEventListener("click", (e) => {
  if (e.target.closest("#back")) return set({ c: null });
  const b = e.target.closest(".prow"); if (b) set({ i: b.dataset.i });
});

// ---- render ----
let heroVal = null;
function render() {
  const { s, l, i, v, c } = state;
  if (!yearsOf(i).includes(state.y)) { state.y = yearsOf(i).at(-1); writeHash(); }
  const y = state.y, sc = scaleOf(i);
  rows = covered.filter((k) => val(i, k, s, y) != null).sort((a, b) => val(i, b, s, y) - val(i, a, s, y));
  const fill = (k) => { const x = val(i, k, s, y); return x == null ? "url(#hatch)" : `var(--b${bin(i, x)})`; };
  ctry.style("fill", (f) => fill(byNum[f.id])).classed("sel", (f) => byNum[f.id] === c)
    .attr("aria-label", (f) => { const k = byNum[f.id], x = val(i, k, s, y);
      return `${name(k)}${EU.has(k) ? "" : ` (${t.nonEU})`}: ${x == null ? t.noData : pct(x)}`; });
  svg.attr("aria-label", v === "globe" ? t.globeLabel : t.mapLabel).classed("globe", v === "globe");
  if (tipFor) tip.innerHTML = tipHtml(tipFor);

  // legend for this indicator's bins
  const [b1, b2, b3, b4] = sc.bins, lbl = [`<${num(b1)}`, `${num(b1)}–${num(b2)}`, `${num(b2)}–${num(b3)}`, `${num(b3)}–${num(b4)}`, `${num(b4)}+`];
  $("legend").innerHTML = `<span>${t.base[IND[i].base]}</span><span class="scale">` +
    lbl.map((x, k) => `<span><i style="background:var(--b${k})"></i>${x}%</span>`).join("") +
    `</span><span class="nd"><i></i>${t.noData}</span>`;

  // headline: the number runs to its new value
  const eu = val(i, "EU27", s, y), py = prevYear(i, y), peu = py && val(i, "EU27", s, py);
  const hero = d3.select("#heroNum").interrupt();
  if (eu == null) hero.text(t.noData);
  else if (heroVal == null || !DUR) hero.text(pct(eu));
  else { const from = heroVal;
    hero.transition().duration(DUR + 150).ease(d3.easeCubicOut)
      .tween("text", () => { const f = d3.interpolateNumber(from, eu); return (k) => hero.text(pct(f(k))); }); }
  heroVal = eu;
  $("heroInd").textContent = `${t.ind[i]} · ${t.base[IND[i].base]}`;
  $("heroLabel").textContent = `${t.eu} · ${cap(t.sizeLong[s])} · ${y}`;
  $("heroDelta").innerHTML = eu != null && peu != null ? `<b>${pp(eu - peu)}</b> ${t.vs} ${py}` : "";
  $("heroSr").textContent = `${t.ind[i]}. ${t.eu}, ${t.sizeLong[s]}, ${y}: ${eu == null ? t.noData : pct(eu)}`;

  // year selector = EU27 trend for this indicator and size; years the indicator lacks are disabled
  const euMax = Math.max(...ALL_YEARS.map((yy) => val(i, "EU27", s, yy) ?? 0)) || 1;
  document.querySelectorAll("#years button").forEach((b) => {
    const yy = b.dataset.y, x = val(i, "EU27", s, yy), has = yearsOf(i).includes(yy);
    b.disabled = !has;
    b.setAttribute("aria-pressed", yy === y);
    b.setAttribute("aria-label", `${yy}, ${t.eu} ${x == null ? t.noData : pct(x)}`);
    b.querySelector(".yv").textContent = x == null ? "–" : pct(x);
    b.querySelector(".col").style.height = `${x == null ? 0 : Math.max(2, (x / euMax) * 64)}px`;
  });
  document.querySelectorAll("#sizes button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.s === s));
  document.querySelectorAll("#views button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === v));
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.l === l));
  $("ind").value = i;
  $("play").textContent = timer ? `❚❚ ${t.pause}` : `▶ ${t.play}`;
  $("play").disabled = yearsOf(i).length < 2;

  // country profile replaces the ranking while open
  $("rank").classList.toggle("open", !!c);
  $("profile").hidden = !c;
  $("rankView").hidden = !!c;
  if (c) $("profile").innerHTML = profileHtml(c);

  // ranking: rows keyed by country slide to their new rank
  $("rankTitle").textContent = `${t.ranking} · ${cap(t.sizeLong[s])} · ${y}`;
  const max = sc.max, euLeft = eu == null ? null : `${(eu / max) * 100}%`;
  $("euRef").innerHTML = eu == null ? "" :
    `<span class="n"></span><span class="nm"><i class="eu-dot"></i><span>${t.euAvg}</span></span><span class="bar"><span class="eu" style="left:${euLeft}"></span></span><span class="val">${pct(eu)}</span>`;
  const at = (k) => `translateY(${k * ROW}px)`;
  const li = d3.select("#rankList").style("height", `${rows.length * ROW}px`)
    .selectAll("li").data(rows, (d) => d)
    .join(
      (enter) => enter.append("li").style("opacity", 0).style("transform", (d, k) => at(k))
        .html(`<button class="row"><span class="n"></span><span class="nm"><span class="cn"></span></span><span class="bar"><i></i></span><span class="val"></span></button>`),
      (update) => update,
      (exit) => exit.transition().duration(DUR).style("opacity", 0).remove(),
    )
    .order(); // DOM order = rank order, for screen readers
  li.transition().duration(DUR).ease(d3.easeCubicInOut).style("opacity", 1).style("transform", (d, k) => at(k));
  li.select(".n").text((d, k) => k + 1);
  li.select(".cn").text(name);
  li.select(".nm").selectAll(".tag").data((d) => (EU.has(d) ? [] : [d])).join("span").attr("class", "tag").text(t.nonEU);
  li.select(".bar i").transition().duration(DUR).ease(d3.easeCubicInOut).style("width", (d) => `${(val(i, d, s, y) / max) * 100}%`);
  li.select(".bar").selectAll(".eu").data(euLeft ? [euLeft] : []).join("span").attr("class", "eu")
    .transition().duration(DUR).style("left", (d) => d);
  li.select(".val").html((d) => { const f = flag(i, d, s, y);
    return `${pct(val(i, d, s, y))}${f ? `<abbr title="${t.note}: ${flagText(f)}">*</abbr>` : ""}`; });

  const missing = covered.filter((k) => val(i, k, s, y) == null).map(name);
  $("missing").textContent = [missing.length ? `${t.noDataFor(y)} ${missing.join(", ")}.` : "",
    rows.some((k) => flag(i, k, s, y)) ? t.flagFoot : ""].filter(Boolean).join(" ");
}

// ---- controls ----
let timer = null;
function stop() { clearInterval(timer); timer = null; $("play").setAttribute("aria-pressed", false); render(); }
function set(patch) {
  const opened = patch.c && patch.c !== state.c, closed = "c" in patch && !patch.c && state.c;
  const prevC = state.c, viewChanged = patch.v && patch.v !== state.v;
  Object.assign(state, patch); writeHash(); render();
  if (viewChanged) { if (state.v === "globe") spinIn(); else draw(); }
  if (opened || closed) $("rank").scrollTop = 0;
  if (opened) $("cpName")?.focus({ preventScroll: true });
  if (closed) ctry.filter((f) => byNum[f.id] === prevC).node()?.focus({ preventScroll: true });
}
$("years").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { if (timer) stop(); set({ y: b.dataset.y }); } });
$("sizes").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set({ s: b.dataset.s }); });
$("views").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set({ v: b.dataset.v }); });
$("ind").addEventListener("change", (e) => set({ i: e.target.value }));
document.querySelector(".lang").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (b) { setLang(b.dataset.l); set({ l: b.dataset.l }); } });
$("play").addEventListener("click", () => {
  if (timer) return stop();
  const ys = yearsOf(state.i);
  $("play").setAttribute("aria-pressed", true);
  timer = setInterval(() => {
    const k = ys.indexOf(state.y);
    if (k >= ys.length - 1) return stop();
    set({ y: ys[k + 1] });
    if (k + 1 === ys.length - 1) stop();
  }, STEP_MS);
  if (state.y === ys.at(-1)) set({ y: ys[0] }); else render();
});
addEventListener("hashchange", () => { const v = state.v; readHash(); setLang(state.l); render(); if (state.v !== v) draw(); });

readHash();
setLang(state.l);
draw();
render();
if (state.v === "globe") spinIn();
