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
const SIZE_LABEL = { all: "All enterprises", small: "Small (10-49)", medium: "Medium (50-249)", large: "Large (250+)" };
const BINS = [10, 20, 30, 40]; // fixed for every year and size, so change over time is visible
const STEP_MS = 1500;

const regionName = new Intl.DisplayNames(["en"], { type: "region" });
const name = (c) => regionName.of(c);
// round half up on the decimal value (19.95 -> 20.0, as Eurostat publishes), not on its binary float
const r1 = (v) => (Math.round(Number((v * 10).toPrecision(12))) / 10).toFixed(1);
const pct = (v) => `${r1(v)}%`;
const pp = (d) => `${d >= 0 ? "+" : "−"}${r1(Math.abs(d))} pp`;
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
const flagText = (f) => { const t = data.flagLabels[f] ?? f; return t[0].toUpperCase() + t.slice(1); };
const prevYear = (y) => YEARS[YEARS.indexOf(y) - 1];
const allVals = Object.values(data.values).flatMap((s) => Object.values(s).flatMap(Object.values));
const BAR_MAX = Math.ceil(Math.max(...allVals) / 10) * 10;
const bin = (v) => BINS.filter((t) => v >= t).length;

// ---- state <-> hash ----
const state = { y: YEARS.at(-1), s: "all" };
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  state.y = YEARS.includes(p.get("y")) ? p.get("y") : YEARS.at(-1);
  state.s = p.get("s") in SIZE_LABEL ? p.get("s") : "all";
}
const writeHash = () => history.replaceState(null, "", `#y=${state.y}&s=${state.s}`);

// ---- static chrome ----
$("part1").href = PART1_URL;
Object.assign($("author"), { href: AUTHOR_URL, textContent: AUTHOR_NAME });
$("srcLink").href = data.sourceUrl;
$("extracted").textContent = data.extractedAt;
$("years").innerHTML = YEARS.map((y) => `<button data-y="${y}">${y}</button>`).join("");
const swatch = (i) => `<i style="background:var(--b${i})"></i>`;
const binLabels = ["<10%", "10–20%", "20–30%", "30–40%", "40%+"];
$("legend").innerHTML = binLabels.map((l, i) => `<span>${swatch(i)}${l}</span>`).join("") +
  `<span><i class="nd"></i>No data</span>`;

// ---- map ----
const W = 600, H = 620;
const svg = d3.select("#map");
svg.append("defs").append("pattern").attr("id", "hatch").attr("width", 6).attr("height", 6)
  .attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)")
  .call((p) => { p.append("rect").attr("class", "hatch-bg").attr("width", 6).attr("height", 6);
                 p.append("line").attr("class", "hatch-line").attr("y2", 6); });
const projection = d3.geoAzimuthalEqualArea().rotate([-14, -52]).clipAngle(50)
  .fitExtent([[8, 8], [W - 8, H - 8]], { type: "MultiPoint", coordinates: [[-10, 36], [33, 35], [44, 41], [30, 70], [-9, 62], [5, 71]] });
const path = d3.geoPath(projection);
const feats = topojson.feature(world, world.objects.countries).features;
const isCovered = (f) => byNum[f.id];
svg.append("g").selectAll("path").data(feats.filter((f) => !isCovered(f))).join("path").attr("class", "land").attr("d", path);
const ctry = svg.append("g").selectAll("path")
  .data(feats.filter(isCovered).sort((a, b) => (byNum[a.id] === "IT") - (byNum[b.id] === "IT")))
  .join("path")
  .attr("class", (f) => `ctry${byNum[f.id] === "IT" ? " it" : ""}`)
  .attr("d", path).attr("tabindex", 0).attr("role", "img");
// two-line label in the Tyrrhenian Sea, between Sardinia and Calabria
const [ix, iy] = projection([12.4, 40.3]);
const itLabel = svg.append("text").attr("class", "itlbl").attr("text-anchor", "middle");
itLabel.append("tspan").attr("x", ix).attr("y", iy).text("Italy");
const itVal = itLabel.append("tspan").attr("x", ix).attr("dy", "1.1em");

// ---- tooltip ----
const wrap = document.querySelector(".mapwrap"), tip = $("tip");
function tipHtml(c) {
  const { y, s } = state, v = val(c, s, y);
  const tag = EU.has(c) ? "" : `<span class="tag">non-EU</span>`;
  if (v == null) return `<b>${name(c)}</b>${tag}<br><span class="m">No data</span>`;
  const py = prevYear(y), pv = py && val(c, s, py), f = flag(c, s, y);
  return `<b>${name(c)}</b>${tag}<br><span class="v">${pct(v)}</span> <span class="m">in ${y}</span>` +
    (pv != null && py ? `<br>${pp(v - pv)} vs ${py}` : "") +
    (f ? `<br><span class="m">Eurostat note: ${flagText(f)}</span>` : "");
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
  .on("focus", function (e, f) {
    const k = wrap.getBoundingClientRect().width / W, [cx, cy] = path.centroid(f);
    showTip(byNum[f.id], cx * k, cy * k);
  })
  .on("blur", hideTip);
svg.on("pointerdown", (e) => { if (!e.target.classList.contains("ctry")) hideTip(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTip(); });

// ---- render ----
function render() {
  const { y, s } = state;
  const fill = (c) => { const v = val(c, s, y); return v == null ? "url(#hatch)" : `var(--b${bin(v)})`; };
  ctry.style("fill", (f) => fill(byNum[f.id]))
    .attr("aria-label", (f) => { const c = byNum[f.id], v = val(c, s, y);
      return `${name(c)}${EU.has(c) ? "" : " (non-EU)"}: ${v == null ? "No data" : pct(v)}`; });
  const itv = val("IT", s, y);
  itVal.text(itv == null ? "No data" : pct(itv));
  if (tipFor) tip.innerHTML = tipHtml(tipFor);

  // headline
  const eu = val("EU27", s, y), py = prevYear(y), peu = py && val("EU27", s, py);
  $("heroNum").textContent = eu == null ? "No data" : pct(eu);
  $("heroLabel").textContent = `EU27 · ${SIZE_LABEL[s]} · ${y}`;
  $("heroDelta").textContent = eu != null && peu != null ? `${pp(eu - peu)} vs ${py}` : "";

  // controls
  document.querySelectorAll("#years button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.y === y));
  document.querySelectorAll("#sizes button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.s === s));

  // ranking
  const rows = covered.filter((c) => val(c, s, y) != null).sort((a, b) => val(b, s, y) - val(a, s, y));
  const euMark = eu == null ? "" : `<span class="eu" style="left:${(eu / BAR_MAX) * 100}%"></span>`;
  $("rankTitle").textContent = `Ranking · ${SIZE_LABEL[s]} · ${y}`;
  $("rankList").innerHTML =
    (eu == null ? "" : `<li class="euref"><span class="n"></span><span class="nm">EU27 average</span><span class="bar">${euMark}</span><span class="val">${pct(eu)}</span></li>`) +
    rows.map((c, i) => { const v = val(c, s, y), f = flag(c, s, y);
      return `<li class="${c === "IT" ? "it" : ""}"><span class="n">${i + 1}</span>` +
        `<span class="nm"><span>${name(c)}</span>${EU.has(c) ? "" : '<span class="tag">non-EU</span>'}</span>` +
        `<span class="bar"><i style="width:${(v / BAR_MAX) * 100}%"></i>${euMark}</span>` +
        `<span class="val">${pct(v)}${f ? `<abbr title="Eurostat note: ${flagText(f)}">*</abbr>` : ""}</span></li>`; }).join("");
  const missing = covered.filter((c) => val(c, s, y) == null).map(name);
  const flagged = rows.some((c) => flag(c, s, y));
  $("missing").textContent = (missing.length ? `No data for ${y}: ${missing.join(", ")}. ` : "") +
    (flagged ? "* Eurostat note (hover or see map tooltip)." : "");
}

// ---- controls ----
let timer = null;
const playBtn = $("play");
function stop() { clearInterval(timer); timer = null; playBtn.setAttribute("aria-pressed", false); playBtn.textContent = "▶ Play"; }
function set(patch) { Object.assign(state, patch); writeHash(); render(); }
$("years").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { stop(); set({ y: b.dataset.y }); } });
$("sizes").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set({ s: b.dataset.s }); });
playBtn.addEventListener("click", () => {
  if (timer) return stop();
  playBtn.setAttribute("aria-pressed", true); playBtn.textContent = "❚❚ Pause";
  if (state.y === YEARS.at(-1)) set({ y: YEARS[0] });
  timer = setInterval(() => {
    const i = YEARS.indexOf(state.y);
    if (i >= YEARS.length - 1) return stop();
    set({ y: YEARS[i + 1] });
    if (i + 1 === YEARS.length - 1) stop();
  }, STEP_MS);
});
addEventListener("hashchange", () => { readHash(); render(); });

readHash();
render();
