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
  { id: "source", base: "users", items: ["ardy", "amown", "aos", "adown", "aext"] },
  { id: "dii", base: "share", items: ["dvhi", "dhi", "dlo", "dvlo"] },
  { id: "barrier", base: "considered", items: ["ec", "ble", "bleg", "bcdp", "bddt", "binc", "bcst", "bec", "bnu"] },
];
const IND = Object.fromEntries(GROUPS.flatMap((g) => g.items.map((k) => [k, g])));
// items whose percentage has another base than their group: "considered using AI" is a share of non-users
const baseOf = (k) => ({ ec: "nonUsers" })[k] ?? IND[k].base;

const T = {
  en: {
    title: "How fast is AI spreading through European businesses?",
    sub: "Share of enterprises (10+ employees) using at least one AI technology. Source: Eurostat.",
    year: "Year", size: "Company size", indicator: "Indicator", view: "View", map: "Map", globe: "Globe",
    playYears: "Play through the years", skipped: (y) => `No data for ${y}: Eurostat's survey had no AI questions that year.`,
    sector: "Sector", sectorAll: "All sectors", bySector: "By sector",
    sectors: { C: "Manufacturing", D_E: "Energy, water and waste", F: "Construction", G: "Wholesale and retail trade",
      H: "Transport and storage", I: "Accommodation and food services", J: "Information and communication", L: "Real estate",
      M: "Professional, scientific and technical activities", N: "Administrative and support services" },
    sectorNote: "Sector figures cover all enterprises with 10+ employees: Eurostat doesn't publish them by company size.",
    gapTitle: "Small vs large enterprises", sortBy: "Sort by", sort: { gap: "Gap", small: "Small", large: "Large" }, gap: "Gap",
    gapHint: "Each row joins small, medium and large enterprises in a country. Gap = large minus small, in percentage points. Select a country for its profile.",
    gapNA: "Eurostat doesn't publish sector figures by company size. Choose \"All sectors\" to compare small and large enterprises.",
    gapMissing: (y) => `No data for small or large enterprises in ${y}:`,
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
    seriesLink: "See Part 1 →", source: "Source:", dataset: "datasets", and: "and", extracted: "extracted",
    builtBy: "Built by", privacy: "No data is collected from visitors.", toDark: "Switch to dark theme", toLight: "Switch to light theme",
    flags: { b: "Break in series", u: "Low reliability", bu: "Break in series, low reliability", d: "Definition differs", e: "Estimate", p: "Provisional", c: "Confidential" },
    groups: { adoption: "Adoption", tech: "Technologies", purpose: "What AI is used for", source: "How AI is obtained",
      dii: "AI users by digital intensity", barrier: "Why non-users hold back" },
    base: { share: "% of enterprises", users: "% of enterprises using AI", nonUsers: "% of enterprises not using AI",
      considered: "% of enterprises that considered AI but don't use it" },
    short: { dvhi: "Very high", dhi: "High", dlo: "Low", dvlo: "Very low" }, // profile rows, under their group heading
    groupNote: {
      source: "Several answers are possible, so the shares can add up to more than 100%.",
      dii: "Digital intensity counts how many of 12 digital technologies and practices a business uses: very low 0–3, low 4–6, high 7–9, very high 10–12. Together the four levels make up the share of businesses using AI.",
    },
    ind: {
      ardy: "Ready-to-use commercial AI", amown: "Commercial AI modified in-house", aos: "Open-source AI modified in-house",
      adown: "AI developed in-house", aext: "AI developed or modified by external providers",
      dvhi: "Uses AI, very high digital intensity", dhi: "Uses AI, high digital intensity",
      dlo: "Uses AI, low digital intensity", dvlo: "Uses AI, very low digital intensity", ec: "Considered using AI",
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
    playYears: "Riproduci gli anni", skipped: (y) => `Nessun dato per il ${y}: quell'anno l'indagine Eurostat non conteneva domande sull'AI.`,
    sector: "Settore", sectorAll: "Tutti i settori", bySector: "Per settore",
    sectors: { C: "Manifattura", D_E: "Energia, acqua e rifiuti", F: "Costruzioni", G: "Commercio all'ingrosso e al dettaglio",
      H: "Trasporti e magazzinaggio", I: "Alloggio e ristorazione", J: "Informazione e comunicazione", L: "Attività immobiliari",
      M: "Attività professionali, scientifiche e tecniche", N: "Servizi amministrativi e di supporto" },
    sectorNote: "I dati per settore riguardano tutte le imprese con 10+ addetti: Eurostat non li pubblica per dimensione d'impresa.",
    gapTitle: "Piccole e grandi imprese a confronto", sortBy: "Ordina per", sort: { gap: "Divario", small: "Piccole", large: "Grandi" }, gap: "Divario",
    gapHint: "Ogni riga unisce piccole, medie e grandi imprese di un paese. Divario = grandi meno piccole, in punti percentuali. Seleziona un paese per la scheda.",
    gapNA: "Eurostat non pubblica i dati per settore suddivisi per dimensione d'impresa. Scegli \"Tutti i settori\" per confrontare piccole e grandi imprese.",
    gapMissing: (y) => `Nessun dato per piccole o grandi imprese nel ${y}:`,
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
    seriesLink: "Vedi la prima puntata →", source: "Fonte:", dataset: "dataset", and: "e", extracted: "estratti il",
    builtBy: "Realizzato da", privacy: "Nessun dato viene raccolto dai visitatori.", toDark: "Passa al tema scuro", toLight: "Passa al tema chiaro",
    flags: { b: "Interruzione di serie", u: "Bassa affidabilità", bu: "Interruzione di serie, bassa affidabilità", d: "Definizione diversa", e: "Stima", p: "Provvisorio", c: "Riservato" },
    groups: { adoption: "Adozione", tech: "Tecnologie", purpose: "Per cosa si usa l'AI", source: "Come si ottiene l'AI",
      dii: "Chi usa l'AI, per intensità digitale", barrier: "Perché chi non la usa si frena" },
    base: { share: "% delle imprese", users: "% delle imprese che usano l'AI", nonUsers: "% delle imprese che non usano l'AI",
      considered: "% delle imprese che hanno valutato l'AI ma non la usano" },
    short: { dvhi: "Molto alta", dhi: "Alta", dlo: "Bassa", dvlo: "Molto bassa" },
    groupNote: {
      source: "Sono possibili più risposte, quindi la somma delle quote può superare il 100%.",
      dii: "L'intensità digitale conta quante di 12 tecnologie e pratiche digitali usa un'impresa: molto bassa 0–3, bassa 4–6, alta 7–9, molto alta 10–12. Insieme, i quattro livelli formano la quota di imprese che usano l'AI.",
    },
    ind: {
      ardy: "AI commerciale pronta all'uso", amown: "AI commerciale modificata internamente", aos: "AI open source modificata internamente",
      adown: "AI sviluppata internamente", aext: "AI sviluppata o modificata da fornitori esterni",
      dvhi: "Usa l'AI, intensità digitale molto alta", dhi: "Usa l'AI, intensità digitale alta",
      dlo: "Usa l'AI, intensità digitale bassa", dvlo: "Usa l'AI, intensità digitale molto bassa", ec: "Ha valutato l'uso dell'AI",
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
const BANDS = ["small", "medium", "large"];

const $ = (id) => document.getElementById(id);
const [data, world, sect] = await Promise.all([
  d3.json("data/ai-adoption.json"),
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
  d3.json("data/ai-sectors.json"),
]);
const covered = Object.keys(NUM);
const byNum = Object.fromEntries(covered.map((c) => [NUM[c], c]));
const ALL_YEARS = [...new Set([data.years, ...Object.values(data.more).map((m) => m.years)].flat())].sort().map(String);
const SECTORS = ["all", ...Object.keys(sect.sectors)];

// n = sector ("all" = every sector, by size class); sector figures exist for size "all" only
const src = (i, n = state.n) => (n !== "all" ? sect.sectors[n][i] : i === "any" ? data : data.more[i]);
const val = (i, c, s, y, n) => src(i, n).values[c]?.[s]?.[y];
const flag = (i, c, s, y, n) => src(i, n).flags[c]?.[s]?.[y];
const yearsOf = (i, n) => src(i, n).years.map(String);
const prevYear = (i, y) => { const ys = yearsOf(i); return ys[ys.indexOf(y) - 1]; };
// round half up on the decimal value (19.95 -> 20.0, as Eurostat publishes), not on its binary float
const r1 = (v) => Math.round(Number((v * 10).toPrecision(12))) / 10;

// Colour bins per indicator (and sector): four equal "nice" steps sized on the all-enterprises country
// values, fixed across years and sizes so change is visible. For the headline indicator this gives 10/20/30/40.
const NICE = [1, 2, 2.5, 5, 10, 20, 25];
const scales = {};
function scaleOf(i, n = state.n) {
  const key = `${i}|${n}`;
  if (scales[key]) return scales[key];
  const v = src(i, n).values;
  const allSize = covered.flatMap((c) => Object.values(v[c]?.all ?? {}));
  const every = Object.values(v).flatMap((s) => Object.values(s).flatMap(Object.values));
  const step = NICE.find((k) => k >= Math.max(...allSize) / 5) ?? 25;
  return (scales[key] = { bins: [1, 2, 3, 4].map((k) => k * step), max: Math.ceil(Math.max(...every) / step) * step });
}
const bin = (i, v) => scaleOf(i).bins.filter((b) => v >= b).length;

// ---- state <-> hash ----
const VIEWS = ["map", "globe"];
const state = { y: ALL_YEARS.at(-1), s: "all", l: "en", i: "any", v: "map", c: null, n: "all" };
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  state.n = SECTORS.includes(p.get("n")) ? p.get("n") : "all";
  state.i = p.get("i") in IND ? p.get("i") : "any";
  state.y = yearsOf(state.i).includes(p.get("y")) ? p.get("y") : yearsOf(state.i).at(-1);
  state.s = state.n === "all" && p.get("s") in SIZE_RANGE ? p.get("s") : "all";
  state.l = p.get("l") === "it" ? "it" : "en";
  state.v = VIEWS.includes(p.get("v")) ? p.get("v") : "map";
  state.c = covered.includes(p.get("c")) ? p.get("c") : null;
}
function writeHash() {
  const { y, s, l, i, v, c, n } = state;
  const extra = [n !== "all" && `n=${n}`, i !== "any" && `i=${i}`, v !== "map" && `v=${v}`, c && `c=${c}`, l === "it" && "l=it"].filter(Boolean);
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
  $("views").setAttribute("aria-label", t.view); // no visible label: the toggle sits on the map it switches
  Object.assign($("play"), { title: t.playYears, ariaLabel: t.playYears }); // the icon shows play or pause
  syncTheme();
  Object.assign($("yearNote"), { hidden: !SKIPPED.length, textContent: SKIPPED.length ? t.skipped(SKIPPED.join(", ")) : "" });
  $("ind").innerHTML = GROUPS.map((g) => `<optgroup label="${t.groups[g.id]}">` +
    g.items.map((k) => `<option value="${k}">${t.ind[k]}</option>`).join("") + "</optgroup>").join("");
  $("sector").innerHTML = SECTORS.map((n) => `<option value="${n}">${n === "all" ? t.sectorAll : t.sectors[n]}</option>`).join("");
  document.querySelectorAll("#gapSort button").forEach((b) => (b.textContent = t.sort[b.dataset.o]));
  $("gapKey").innerHTML = BANDS.map((s) => `<span><i class="dt ${s}"></i>${t.sizes[s]} <small>${SIZE_RANGE[s]}</small></span>`).join("");
}
// what the figures on screen cover: a size class (all sectors) or a sector (all sizes)
const scope = () => (state.n === "all" ? t.sizeLong[state.s] : t.sectors[state.n]);

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
$("srcLink2").href = sect.sourceUrl;
$("extracted").textContent = data.extractedAt;
// years inside the range that Eurostat didn't survey (2022: no AI questions) show as a marked gap, never a value
const SKIPPED = d3.range(+ALL_YEARS[0], +ALL_YEARS.at(-1)).map(String).filter((y) => !ALL_YEARS.includes(y));
$("years").innerHTML = ALL_YEARS.map((y, k) => {
  const miss = SKIPPED.filter((g) => g > (ALL_YEARS[k - 1] ?? "") && g < y);
  return (miss.length ? `<span class="ygap" aria-hidden="true"><span class="yl">${miss.join(" ")}</span></span>` : "") +
    `<button data-y="${y}"><span class="yv"></span><span class="col"></span><span class="yl">${y}</span></button>`;
}).join("");

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
  return `${head}<span class="v">${pct(v)}</span><span class="m">${scope()}, ${y} · ${rows.indexOf(c) + 1}/${rows.length}</span>` +
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
function openCountry(c, scroll = matchMedia("(max-width: 919px)").matches) {
  set({ c });
  if (scroll) { hideTip(); $("rank").scrollIntoView({ behavior: DUR ? "smooth" : "auto", block: "start" }); }
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
  if (gapFor) hideGapTip(); else if (tipFor) hideTip(); else if (state.c) set({ c: null });
});
// hovering a ranking row points at the country on the map (mouse only; on touch the list is just a list)
d3.select("#rankList")
  .on("pointerover", (e) => { const li = e.target.closest("li"); if (li && e.pointerType === "mouse") tipAtCountry(d3.select(li).datum()); })
  .on("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); })
  .on("click", (e) => { const li = e.target.closest("li"); if (li) openCountry(d3.select(li).datum()); });

// ---- country profile ----
// one profile row: a button that puts its indicator (data-i) or sector (data-n) on the map
const prow = (attr, current, label, cv, ev, f, max, spoken = label) =>
  `<li><button class="prow" ${attr} aria-current="${current}" aria-label="${spoken}: ${cv == null ? t.noData : pct(cv)}${ev == null ? "" : `, ${t.eu} ${pct(ev)}`}">` +
  `<span class="pl">${label}</span><span class="bar">${cv == null ? "" : `<i style="width:${(cv / max) * 100}%"></i>`}` +
  `${ev == null ? "" : `<span class="eu" style="left:${(ev / max) * 100}%"></span>`}</span>` +
  `<span class="val">${cv == null ? "–" : pct(cv)}${f ? `<abbr title="${t.note}: ${flagText(f)}">*</abbr>` : ""}</span></button></li>`;
const ceil10 = (vals) => Math.ceil(Math.max(...vals) / 10) * 10;
const desc = (f) => (a, b) => (f(b) ?? -1) - (f(a) ?? -1); // highest first, no data last
function profileHtml(c) {
  const { y, s, i, n } = state;
  const v = val(i, c, s, y), eu = val(i, "EU27", s, y);
  const tag = EU.has(c) ? "" : `<span class="tag">${t.nonEU}</span>`;
  const head = `<div class="cp-head"><button class="back" id="back" aria-label="${t.close}">${t.back}</button>` +
    `<p class="cp-sub">${cap(scope())} · ${y}</p></div>` +
    `<h2 class="cp-name" id="cpName" tabindex="-1">${name(c)}${tag}</h2>` +
    `<div class="cp-hero"><p class="cp-ind">${t.ind[i]}</p><p class="cp-num">${v == null ? t.noData : pct(v)}</p>` +
    `<p class="cp-cmp">${[eu != null && `${t.euAvg} <b>${pct(eu)}</b>`, v != null && `${t.rank} <b>${rows.indexOf(c) + 1}/${rows.length}</b>`].filter(Boolean).join(" · ")}</p></div>`;
  // the current indicator in every sector; sector figures exist for all sizes only
  const cell = (k) => [val(i, c, "all", y, k), val(i, "EU27", "all", y, k), flag(i, c, "all", y, k)];
  const secVals = s === "all" ? SECTORS.flatMap((k) => cell(k).slice(0, 2)).filter((x) => x != null) : [];
  const bySector = !secVals.length ? "" :
    `<section class="cp-sec"><h3>${t.bySector}</h3><p class="cp-base">${t.ind[i]} · ${t.base[baseOf(i)]}</p><ul>` +
    ["all", ...SECTORS.slice(1).sort(desc((k) => cell(k)[0]))].map((k) =>
      prow(`data-n="${k}"`, k === n, k === "all" ? t.sectorAll : t.sectors[k], ...cell(k), ceil10(secVals))).join("") + "</ul></section>";
  const sections = GROUPS.map((g) => {
    // highest first; ties broken by EU27 value
    const items = g.items.filter((k) => yearsOf(k).includes(y))
      .sort((a, b) => desc((k) => val(k, c, s, y))(a, b) || desc((k) => val(k, "EU27", s, y))(a, b));
    const vals = items.flatMap((k) => [val(k, c, s, y), val(k, "EU27", s, y)]).filter((x) => x != null);
    if (!vals.length) return `<section class="cp-sec"><h3>${t.groups[g.id]}</h3><p class="note">${t.notSurveyed(y)}</p></section>`;
    const row = (k) => prow(`data-i="${k}"`, k === i, t.short[k] ?? t.ind[k], val(k, c, s, y), val(k, "EU27", s, y), flag(k, c, s, y), ceil10(vals), t.ind[k]);
    const list = (ks, base, note) => (ks.length ? `<p class="cp-base">${t.base[base]}</p>${note ? `<p class="cp-base">${note}</p>` : ""}<ul>${ks.map(row).join("")}</ul>` : "");
    // an item on another base ("considered using AI": a share of non-users) leads its group under its own base line
    const lead = items.filter((k) => baseOf(k) !== g.base);
    return `<section class="cp-sec"><h3>${t.groups[g.id]}</h3>${lead.length ? list(lead, baseOf(lead[0])) : ""}` +
      `${list(items.filter((k) => baseOf(k) === g.base), g.base, t.groupNote[g.id])}</section>`;
  }).join("");
  return head + bySector + sections + `<p class="note cp-key"><i class="eu-tick"></i>${t.euAvg}</p>`;
}
$("profile").addEventListener("click", (e) => {
  if (e.target.closest("#back")) return set({ c: null });
  const b = e.target.closest(".prow");
  if (!b) return;
  const { n, i } = b.dataset, again = n ? `[data-n="${n}"]` : `[data-i="${i}"]`;
  set(n ? { n } : { i });
  $("profile").querySelector(`.prow${again}`)?.focus({ preventScroll: true }); // keep keyboard focus on the row
});

// ---- small vs large enterprises: a row per country, one dot per size class ----
let gapSort = "gap", gapFor = null;
const GROW = 26; // row height, px
const gapSec = $("gapSec"), gapTip = $("gapTip");
const sizesOf = (c) => BANDS.map((b) => val(state.i, c, b, state.y, "all"));
const gapOf = (c) => { const [sm, , lg] = sizesOf(c); return lg - sm; };
const hasGap = (c) => { const [sm, , lg] = sizesOf(c); return sm != null && lg != null; };
function gapHtml(c) {
  const vs = sizesOf(c);
  return `<span class="m ind">${t.ind[state.i]}, ${state.y}</span><b>${c === "EU27" ? t.eu : name(c)}</b>` +
    BANDS.map((b, j) => `<br>${t.sizes[b]} <span class="m">${SIZE_RANGE[b]}</span> ${vs[j] == null ? t.noData : pct(vs[j])}`).join("") +
    `<br>${t.gap}: <b>${pp(vs[2] - vs[0])}</b>`;
}
function renderGap() {
  const { i, y, n } = state, na = n !== "all"; // sectors have no size breakdown
  $("gapSub").textContent = `${t.ind[i]} · ${t.base[baseOf(i)]} · ${y}`;
  $("gapBody").hidden = $("gapKey").hidden = $("gapHint").hidden = na;
  document.querySelectorAll("#gapSort button").forEach((b) => { b.setAttribute("aria-pressed", b.dataset.o === gapSort); b.disabled = na; });
  if (na) { hideGapTip(); $("gapNote").textContent = t.gapNA; return; }
  const by = { gap: gapOf, small: (c) => sizesOf(c)[0], large: (c) => sizesOf(c)[2] }[gapSort];
  const shown = (c) => (gapSort === "gap" ? pp(gapOf(c)) : pct(by(c))); // the right column shows what the rows are sorted by
  const list = covered.filter(hasGap).sort((a, b) => by(b) - by(a));
  // shared axis from 0 to a nice max; the gridlines are each track's background, one per tick
  const x = d3.scaleLinear().domain([0, d3.max([...list, "EU27"].flatMap(sizesOf)) || 1]).nice(4);
  const ticks = x.ticks(4), at = (v) => `${(v / x.domain()[1]) * 100}%`;
  gapSec.style.setProperty("--grid", `${100 / (ticks.length - 1)}%`);
  $("gapAxis").innerHTML = `<span></span><span class="ticks">${ticks.map((v) => `<span style="left:${at(v)}">${num(v)}%</span>`).join("")}</span>` +
    `<span class="vh">${t.sort[gapSort]}</span>`;
  const place = (sel) => {
    BANDS.forEach((b, j) => sel.select(`.dt.${b}`).style("display", (d) => (sizesOf(d)[j] == null ? "none" : null)).style("left", (d) => at(sizesOf(d)[j] ?? 0)));
    sel.select(".ln").style("left", (d) => at(d3.min(sizesOf(d)))).style("width", (d) => at(d3.max(sizesOf(d)) - d3.min(sizesOf(d))));
    sel.select(".val").text(shown);
  };
  const eu = d3.select("#gapEu").datum("EU27").property("hidden", !hasGap("EU27")); // reference row, pinned on top
  if (hasGap("EU27")) place(eu);
  const li = d3.select("#gapList").style("height", `${list.length * GROW}px`)
    .selectAll("li").data(list, (d) => d)
    .join(
      (enter) => enter.append("li").style("opacity", 0).style("transform", (d, k) => `translateY(${k * GROW}px)`)
        .html(`<button class="gap-row"><span class="nm"><span class="cn"></span></span><span class="trk"><i class="ln"></i>` +
          `${BANDS.map((b) => `<i class="dt ${b}"></i>`).join("")}</span><span class="val"></span></button>`),
      (update) => update,
      (exit) => exit.transition().duration(DUR).style("opacity", 0).remove(),
    )
    .order(); // DOM order = visual order, for screen readers
  li.transition().duration(DUR).ease(d3.easeCubicInOut).style("opacity", 1).style("transform", (d, k) => `translateY(${k * GROW}px)`);
  li.select(".cn").text(name);
  li.select(".nm").selectAll(".tag").data((d) => (EU.has(d) ? [] : [d])).join("span").attr("class", "tag").text(t.nonEU);
  place(li);
  li.select("button").attr("aria-label", (d) => `${name(d)}: ${BANDS.map((b, j) => `${t.sizes[b]} ${sizesOf(d)[j] == null ? t.noData : pct(sizesOf(d)[j])}`).join(", ")}, ${t.gap} ${pp(gapOf(d))}`);
  const missing = covered.filter((c) => !hasGap(c)).map(name);
  $("gapNote").textContent = missing.length ? `${t.gapMissing(y)} ${missing.join(", ")}.` : "";
  if (gapFor) gapTip.innerHTML = gapHtml(gapFor);
}
function showGapTip(c, row, clientX) {
  gapFor = c;
  gapTip.innerHTML = gapHtml(c);
  gapTip.hidden = false;
  const box = gapSec.getBoundingClientRect(), r = row.getBoundingClientRect();
  const left = Math.min(Math.max((clientX ?? r.left + r.width / 2) - box.left + 12, 4), box.width - gapTip.offsetWidth - 4);
  const below = r.bottom - box.top + 4; // under the row, or above it near the bottom of the panel
  const top = below + gapTip.offsetHeight > box.height ? r.top - box.top - gapTip.offsetHeight - 4 : below;
  Object.assign(gapTip.style, { left: `${left}px`, top: `${top}px` });
}
function hideGapTip() { gapFor = null; gapTip.hidden = true; }
const gapRow = (e) => e.target.closest("#gapList li, #gapEu");
d3.select("#gapBody")
  .on("pointerover", (e) => { const r = gapRow(e); if (r && e.pointerType === "mouse") showGapTip(d3.select(r).datum(), r, e.clientX); })
  .on("pointerleave", (e) => { if (e.pointerType === "mouse") hideGapTip(); })
  .on("focusin", (e) => { const r = gapRow(e); if (r) showGapTip(d3.select(r).datum(), r); })
  .on("focusout", hideGapTip)
  .on("click", (e) => { const li = e.target.closest("#gapList li"); if (li) { hideGapTip(); openCountry(d3.select(li).datum(), true); } });
$("gapSort").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { gapSort = b.dataset.o; renderGap(); } });

// ---- render ----
let heroVal = null;
function render() {
  const { s, l, i, v, c, n } = state;
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
  const gNote = t.groupNote[IND[i].id];
  $("legend").innerHTML = `<span>${t.base[baseOf(i)]}</span><span class="scale">` +
    lbl.map((x, k) => `<span><i style="background:var(--b${k})"></i>${x}%</span>`).join("") +
    `</span><span class="nd"><i></i>${t.noData}</span>${gNote ? `<span class="lnote">${gNote}</span>` : ""}`;

  // headline: the number runs to its new value
  const eu = val(i, "EU27", s, y), py = prevYear(i, y), peu = py && val(i, "EU27", s, py);
  const hero = d3.select("#heroNum").interrupt();
  if (eu == null) hero.text(t.noData);
  else if (heroVal == null || !DUR) hero.text(pct(eu));
  else { const from = heroVal;
    hero.transition().duration(DUR + 150).ease(d3.easeCubicOut)
      .tween("text", () => { const f = d3.interpolateNumber(from, eu); return (k) => hero.text(pct(f(k))); }); }
  heroVal = eu;
  $("heroInd").textContent = `${t.ind[i]} · ${t.base[baseOf(i)]}`;
  $("heroLabel").textContent = `${t.eu} · ${cap(scope())} · ${y}`;
  $("heroDelta").innerHTML = eu != null && peu != null ? `<b>${pp(eu - peu)}</b> ${t.vs} ${py}` : "";
  $("heroSr").textContent = `${t.ind[i]}. ${t.eu}, ${scope()}, ${y}: ${eu == null ? t.noData : pct(eu)}`;

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
  // a sector has no size breakdown: only "all" stays available, and a note says why
  document.querySelectorAll("#sizes button").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.s === s);
    b.disabled = n !== "all" && b.dataset.s !== "all";
  });
  $("sizeNote").hidden = n === "all";
  $("sector").value = n;
  document.querySelectorAll("#views button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === v));
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.l === l));
  $("ind").value = i;
  $("play").disabled = yearsOf(i).length < 2;

  // country profile replaces the ranking while open
  $("rank").classList.toggle("open", !!c);
  $("profile").hidden = !c;
  $("rankView").hidden = !!c;
  if (c) $("profile").innerHTML = profileHtml(c);

  // ranking: rows keyed by country slide to their new rank
  $("rankTitle").textContent = `${t.ranking} · ${cap(scope())} · ${y}`;
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

  renderGap();
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
$("sector").addEventListener("change", (e) => set({ n: e.target.value, s: e.target.value === "all" ? state.s : "all" }));
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
