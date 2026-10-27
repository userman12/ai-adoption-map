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
const MAXK = 4; // countries in a comparison
const SITE_URL = "https://userman12.github.io/ai-adoption-map/";
// Eurostat's own definition of AI (Statistics Explained), quoted in the indicator dialog
const AI_DEF = "AI refers to systems that use technologies such as text mining, computer vision, speech recognition, natural language generation and speech synthesis, machine learning or deep learning. These technologies can be used to gather and/or use data to predict, recommend or decide, with varying levels of autonomy, the best action to achieve specific goals.";
const AI_DEF_URL = "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Use_of_artificial_intelligence_in_enterprises";
const META_URL = "https://ec.europa.eu/eurostat/cache/metadata/en/isoc_e_esms.htm";

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

// Italian elides the article before numbers read with a vowel: l'8%, l'11%, l'80%, but il 7%, il 20%
const vow = (v) => { const k = parseInt(v, 10); return k === 1 || k === 8 || k === 11 || (k >= 80 && k < 90); };
const il = (v) => (vow(v) ? `l'${v}` : `il ${v}`), dal = (v) => (vow(v) ? `dall'${v}` : `dal ${v}`), al = (v) => (vow(v) ? `all'${v}` : `al ${v}`);

const T = {
  en: {
    title: "How fast is AI spreading through European businesses?",
    sub: "Share of enterprises (10+ employees) using at least one AI technology. Source: Eurostat.",
    year: "Year", size: "Company size", indicator: "Indicator", view: "View", map: "Map", globe: "Globe",
    play: "Play", pause: "Pause", skipped: (y) => `No data for ${y}: Eurostat's survey had no AI questions that year.`,
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
    // share, find, keyboard
    shareView: "Copy a link to this view", copyLink: "Copy link", copied: "Link copied", copyFail: "Couldn't copy: use the address bar",
    image: "Image", imageTip: "Download this profile as an image", saved: "Image saved", find: "Find a country", findNone: (q) => `No country matches “${q}”`,
    keys: "Keyboard: <kbd>←</kbd> <kbd>→</kbd> change year · <kbd>Space</kbd> plays or pauses · <kbd>/</kbd> finds a country · <kbd>Esc</kbd> closes",
    // indicator definition
    define: "Definition", defOfficial: "Eurostat definition", defTechs: "Counts these technologies", defUnit: "Eurostat unit",
    defYears: "Survey years", defCover: "Countries with a value", defCover2: (k, n, y, sc) => `${k} of ${n} in ${y} (${sc})`,
    defCode: "Eurostat code", defAI: "What Eurostat means by AI", defArticle: "Eurostat article on AI in enterprises",
    defMeta: "Survey methodology", defClose: "Close",
    // country profile: trend and comparison
    trend: "Trend", cmpAddThis: "Add to comparison", cmpDropThis: "Remove from comparison", cmpFullThis: "Comparison full",
    cmpGo: (k) => `Go to the comparison (${k})`,
    // compare countries
    cmpTitle: "Compare countries", cmpHint: "Pick 2 to 4 countries to see them side by side on every indicator.",
    cmpAdd: "Add a country", cmpFull: "Up to 4 countries", cmpTry: (names) => `Try ${names}`, cmpRemove: (c) => `Remove ${c}`,
    cmpOne: "Add one more country to compare.",
    // two indicators
    xyTitle: "Two indicators, every country", xyX: "Horizontal axis", xyY: "Vertical axis",
    xyHint: "Each dot is a country; the dashed amber lines mark the EU27. The chart describes, it doesn't explain: two indicators moving together doesn't mean one causes the other. Select a dot for the country profile.",
    xyNone: (y) => `No country has both values for ${y}.`, xyYears: "Years with both:", xyMissing: "No data for:",
    // data table
    dataTitle: "Data table", csv: "Download CSV", country: "Country", code: "Code", notes: "Notes",
    showTable: (n, a, b) => `Show the table: ${n} countries, ${a}–${b}`,
    dataNote: "One decimal here; the CSV keeps every decimal Eurostat publishes.",
    // guided tour
    tour: "What the data says", tourN: (n) => `${n} steps`, tourPrev: "Back", tourNext: "Next", tourDone: "Done", tourClose: "Close the tour",
    st: {
      growth: (a, va, b, vb) => `In ${a}, ${va} of EU businesses with 10 or more employees used at least one AI technology. In ${b}, ${vb} did.`,
      spread: (y, lo, loN, hi, hiN) => `In ${y} the share ranged from ${lo} (${loN}) to ${hi} (${hiN}) across the countries Eurostat surveys.`,
      size: (y, l, s) => `In ${y}, ${l} of large enterprises (250+ employees) used AI, compared with ${s} of small ones (10–49). This chart shows the gap in every country.`,
      sector: (y, hi, hiS, lo, loS) => `By sector, the EU27 share in ${y} ranged from ${lo} (${loS}) to ${hi} (${hiS}). The map now shows that sector.`,
      tech: (y, k, v) => `The most widespread AI technology in ${y} was ${low(k)}: ${v} of EU businesses used it.`,
      barrier: (y, k, v) => `Among businesses that considered AI but don't use it, the reason cited most in ${y} was ${low(k)} (${v}).`,
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
    play: "Riproduci", pause: "Pausa", skipped: (y) => `Nessun dato per il ${y}: quell'anno l'indagine Eurostat non conteneva domande sull'AI.`,
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
    // condivisione, ricerca, tastiera
    shareView: "Copia il link a questa vista", copyLink: "Copia link", copied: "Link copiato", copyFail: "Copia non riuscita: usa la barra degli indirizzi",
    image: "Immagine", imageTip: "Scarica questa scheda come immagine", saved: "Immagine salvata", find: "Cerca un paese", findNone: (q) => `Nessun paese corrisponde a “${q}”`,
    keys: "Tastiera: <kbd>←</kbd> <kbd>→</kbd> cambia anno · <kbd>Spazio</kbd> avvia o ferma · <kbd>/</kbd> cerca un paese · <kbd>Esc</kbd> chiude",
    // definizione dell'indicatore
    define: "Definizione", defOfficial: "Definizione Eurostat (in inglese)", defTechs: "Tecnologie conteggiate", defUnit: "Unità Eurostat",
    defYears: "Anni dell'indagine", defCover: "Paesi con un valore", defCover2: (k, n, y, sc) => `${k} su ${n} nel ${y} (${sc})`,
    defCode: "Codice Eurostat", defAI: "Cosa intende Eurostat per AI (in inglese)", defArticle: "Articolo Eurostat sull'AI nelle imprese",
    defMeta: "Metodologia dell'indagine", defClose: "Chiudi",
    // scheda paese: andamento e confronto
    trend: "Andamento", cmpAddThis: "Aggiungi al confronto", cmpDropThis: "Togli dal confronto", cmpFullThis: "Confronto pieno",
    cmpGo: (k) => `Vai al confronto (${k})`,
    // confronto tra paesi
    cmpTitle: "Confronta i paesi", cmpHint: "Scegli da 2 a 4 paesi per vederli affiancati su tutti gli indicatori.",
    cmpAdd: "Aggiungi un paese", cmpFull: "Al massimo 4 paesi", cmpTry: (names) => `Prova: ${names}`, cmpRemove: (c) => `Togli ${c}`,
    cmpOne: "Aggiungi un altro paese per confrontarli.",
    // due indicatori
    xyTitle: "Due indicatori, tutti i paesi", xyX: "Asse orizzontale", xyY: "Asse verticale",
    xyHint: "Ogni punto è un paese; le linee ambra tratteggiate segnano la UE27. Il grafico descrive, non spiega: due indicatori che vanno insieme non significano che uno causi l'altro. Seleziona un punto per la scheda del paese.",
    xyNone: (y) => `Nessun paese ha entrambi i valori per il ${y}.`, xyYears: "Anni con entrambi:", xyMissing: "Nessun dato per:",
    // tabella dei dati
    dataTitle: "Tabella dei dati", csv: "Scarica CSV", country: "Paese", code: "Codice", notes: "Note",
    showTable: (n, a, b) => `Mostra la tabella: ${n} paesi, ${a}–${b}`,
    dataNote: "Qui un decimale; il CSV conserva tutti i decimali pubblicati da Eurostat.",
    // visita guidata
    tour: "Cosa dicono i dati", tourN: (n) => `${n} passaggi`, tourPrev: "Indietro", tourNext: "Avanti", tourDone: "Fine", tourClose: "Chiudi la visita",
    st: {
      growth: (a, va, b, vb) => `Nel ${a} usava almeno una tecnologia di AI ${il(va)} delle imprese UE con almeno 10 addetti. Nel ${b}, ${il(vb)}.`,
      spread: (y, lo, loN, hi, hiN) => `Nel ${y}, tra i paesi coperti da Eurostat, la quota andava ${dal(lo)} (${loN}) ${al(hi)} (${hiN}).`,
      size: (y, l, s) => `Nel ${y} usava l'AI ${il(l)} delle grandi imprese (250+ addetti) e ${il(s)} delle piccole (10–49). Questo grafico mostra il divario in ogni paese.`,
      sector: (y, hi, hiS, lo, loS) => `Per settore, nel ${y} la quota UE27 andava ${dal(lo)} (${loS}) ${al(hi)} (${hiS}). Ora la mappa mostra quel settore.`,
      tech: (y, k, v) => `Nel ${y} la tecnologia di AI più diffusa era «${k}»: la usava ${il(v)} delle imprese UE.`,
      barrier: (y, k, v) => `Tra le imprese che hanno valutato l'AI ma non la usano, nel ${y} il motivo più citato era «${k}» (${v}).`,
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
// the layout holds still while the years play: a list keeps room for its longest year (has = country has a row that year),
// and a note stacks every year's text in one grid cell (.stack), showing only the current one
const most = (has) => d3.max(yearsOf(state.i), (yy) => covered.filter((c) => has(c, yy)).length) ?? 0;
const byYear = (el, text) => { el.innerHTML = yearsOf(state.i).map((yy) => `<span${yy === state.y ? "" : ' class="off"'}>${text(yy)}</span>`).join(""); };
// round half up on the decimal value (19.95 -> 20.0, as Eurostat publishes), not on its binary float
const r1 = (v) => Math.round(Number((v * 10).toPrecision(12))) / 10;
const low = (x) => x[0].toLocaleLowerCase(state.l) + x.slice(1); // a label used mid-sentence
// icons for buttons built in JS (stroke icons, drawn with currentColor)
const svgI = (d, cls = "") => `<svg${cls && ` class="${cls}"`} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="${d}"/></svg>`;
const ICON = {
  link: svgI("M6.6 9.4a2.6 2.6 0 0 0 3.7 0l2.4-2.4a2.6 2.6 0 0 0-3.7-3.7l-.9.9M9.4 6.6a2.6 2.6 0 0 0-3.7 0L3.3 9a2.6 2.6 0 0 0 3.7 3.7l.9-.9", "i-link"),
  ok: svgI("M3.5 8.5l3 3 6-7", "i-ok"),
  img: svgI("M3.5 3h9a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM2.5 10.5l3.2-3.2 2.8 2.8 1.8-1.8 3.2 3.2"),
  plus: svgI("M8 3.5v9M3.5 8h9"), minus: svgI("M3.5 8h9"), x: svgI("M4.5 4.5l7 7M11.5 4.5l-7 7"),
};

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
const state = { y: ALL_YEARS.at(-1), s: "all", l: "en", i: "any", v: "map", c: null, n: "all", k: [], sx: "any", sy: "ble" };
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  state.n = SECTORS.includes(p.get("n")) ? p.get("n") : "all";
  state.i = p.get("i") in IND ? p.get("i") : "any";
  state.y = yearsOf(state.i).includes(p.get("y")) ? p.get("y") : yearsOf(state.i).at(-1);
  state.s = state.n === "all" && p.get("s") in SIZE_RANGE ? p.get("s") : "all";
  state.l = p.get("l") === "it" ? "it" : "en";
  state.v = VIEWS.includes(p.get("v")) ? p.get("v") : "map";
  state.c = covered.includes(p.get("c")) ? p.get("c") : null;
  state.k = [...new Set((p.get("cmp") ?? "").split(","))].filter((c) => covered.includes(c)).slice(0, MAXK);
  state.sx = p.get("sx") in IND ? p.get("sx") : "any";
  state.sy = p.get("sy") in IND ? p.get("sy") : "ble";
}
function writeHash() {
  const { y, s, l, i, v, c, n, k, sx, sy } = state;
  const extra = [n !== "all" && `n=${n}`, i !== "any" && `i=${i}`, v !== "map" && `v=${v}`, c && `c=${c}`, k.length && `cmp=${k.join(",")}`,
    sx !== "any" && `sx=${sx}`, sy !== "ble" && `sy=${sy}`, l === "it" && "l=it"].filter(Boolean);
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
  syncPlay();
  syncTheme();
  Object.assign($("yearNote"), { hidden: !SKIPPED.length, textContent: SKIPPED.length ? t.skipped(SKIPPED.join(", ")) : "" });
  const opts = GROUPS.map((g) => `<optgroup label="${t.groups[g.id]}">` +
    g.items.map((k) => `<option value="${k}">${t.ind[k]}</option>`).join("") + "</optgroup>").join("");
  for (const id of ["ind", "xyX", "xyY"]) $(id).innerHTML = opts;
  Object.assign($("find"), { placeholder: t.find, ariaLabel: t.find });
  $("findList").ariaLabel = t.find;
  for (const [id, label] of [["share", t.shareView], ["defClose", t.defClose], ["tourClose", t.tourClose]]) Object.assign($(id), { title: label, ariaLabel: label });
  $("cmpAdd").ariaLabel = t.cmpAdd;
  $("keys").innerHTML = t.keys;
  $("tourN").textContent = t.tourN(tourSteps().length);
  if (tourK >= 0) paintStep();
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
  if (e.key !== "Escape" || $("def").open) return; // the open dialog closes itself
  if (gapFor) hideGapTip(); else if (xyFor) hideXYTip(); else if (tipFor) hideTip();
  else if (tourK >= 0) endTour(); else if (state.c) set({ c: null });
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

// trend of one country against the EU27 for the current indicator, size and sector
const niceTop = (m) => d3.scaleLinear().domain([0, m || 1]).nice(4).domain()[1];
function trendOf(c) {
  const { i, s } = state, ys = yearsOf(i).map(Number);
  const pts = (k) => ys.map((y) => [y, val(i, k, s, String(y))]).filter(([, v]) => v != null);
  const cs = pts(c), es = pts("EU27");
  if (ys.length < 2 || cs.length + es.length < 2) return null;
  return { a: ys[0], b: ys.at(-1), top: niceTop(d3.max([...cs, ...es], (p) => p[1])), cs, es };
}
// consecutive points as segments; one that skips a year (2022, or a year a country has no value) is drawn dashed
const segs = (p) => p.slice(1).map((q, k) => [p[k], q, q[0] - p[k][0] > 1]);
const tleg = (c, y) => [[c, "c", name(c)], ["EU27", "e", t.eu]].map(([k, cl, nm]) => {
  const v = val(state.i, k, state.s, y);
  return `<span><i class="sw ${cl}"></i>${nm} <b>${v == null ? "–" : pct(v)}</b></span>`;
}).join("") + `<span class="ty">${y}</span>`;
function trendHtml(c) {
  const tr = trendOf(c);
  if (!tr) return "";
  const { a, b, top, cs, es } = tr, ys = yearsOf(state.i);
  const X = (y) => ((y - a) / (b - a)) * 100, Y = (v) => 100 - (v / top) * 100;
  const d = (p, dashed) => segs(p).filter((g) => g[2] === dashed).map(([p0, p1]) => `M${X(p0[0])} ${Y(p0[1])}L${X(p1[0])} ${Y(p1[1])}`).join("");
  const series = [["e", es], ["c", cs]]; // the country drawn last, on top
  const seq = (p) => p.map(([y, v]) => `${y} ${pct(v)}`).join(", ");
  return `<div class="trend" role="img" aria-label="${t.trend}. ${name(c)}: ${seq(cs)}. ${t.eu}: ${seq(es)}.">` +
    `<div class="tplot"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="tgrid" d="M0 0H100M0 50H100M0 100H100"/>` +
    series.map(([k, p]) => `<path class="tl ${k}" d="${d(p, false)}"/><path class="tl ${k} dash" d="${d(p, true)}"/>`).join("") + "</svg>" +
    `<span class="ttop">${num(top)}%</span><span class="tguide" style="left:${X(+state.y)}%"></span>` +
    series.map(([k, p]) => p.map(([y, v]) => `<i class="tdot ${k}${String(y) === state.y ? " on" : ""}" style="left:${X(y)}%;top:${Y(v)}%"></i>`).join("")).join("") +
    `</div><div class="taxis" aria-hidden="true">` +
    d3.range(a, b + 1).map((y) => `<span class="${String(y) === state.y ? "on" : ys.includes(String(y)) ? "" : "gap"}" style="left:${X(y)}%">${y}</span>`).join("") +
    // hover a year to read its values below, click it to select it
    `</div><div class="tcols" aria-hidden="true">${ys.map((y) => `<span class="tcol" data-y="${y}" style="left:${X(+y - 0.5)}%;width:${X(a + 1)}%"></span>`).join("")}</div>` +
    `</div><p class="tleg" id="tleg">${tleg(c, state.y)}</p>`;
}
const desc = (f) => (a, b) => (f(b) ?? -1) - (f(a) ?? -1); // highest first, no data last
function profileHtml(c) {
  const { y, s, i, n } = state;
  const v = val(i, c, s, y), eu = val(i, "EU27", s, y);
  const tag = EU.has(c) ? "" : `<span class="tag">${t.nonEU}</span>`;
  const inK = state.k.includes(c), full = state.k.length >= MAXK && !inK;
  const head = `<div class="cp-head"><button class="pill back" id="back" type="button" aria-label="${t.close}">${t.back}</button>` +
    `<div class="cp-acts"><button class="pill" id="cpLink" type="button" title="${t.shareView}">${ICON.link}${ICON.ok}<span class="lbl">${t.copyLink}</span></button>` +
    `<button class="pill" id="cpImg" type="button" title="${t.imageTip}">${ICON.img}<span class="lbl">${t.image}</span></button></div></div>` +
    `<h2 class="cp-name" id="cpName" tabindex="-1">${name(c)}${tag}</h2><p class="cp-sub">${cap(scope())} · ${y}</p>` +
    `<div class="cp-hero"><p class="cp-ind">${t.ind[i]}</p><p class="cp-num">${v == null ? t.noData : pct(v)}</p>` +
    `<p class="cp-cmp">${[eu != null && `${t.euAvg} <b>${pct(eu)}</b>`, v != null && `${t.rank} <b>${rows.indexOf(c) + 1}/${rows.length}</b>`].filter(Boolean).join(" · ")}</p>` +
    trendHtml(c) +
    `<div class="cp-cmpbar"><button class="pill" id="cpCmp" type="button"${full ? " disabled" : ""}>${inK ? ICON.minus : ICON.plus}${inK ? t.cmpDropThis : full ? t.cmpFullThis : t.cmpAddThis}</button>` +
    (state.k.length ? `<button class="linkish" id="cpCmpGo" type="button">${t.cmpGo(state.k.length)}</button>` : "") + "</div></div>";
  // the current indicator in every sector; sector figures exist for all sizes only
  const cell = (k) => [val(i, c, "all", y, k), val(i, "EU27", "all", y, k), flag(i, c, "all", y, k)];
  const secVals = s === "all" ? SECTORS.flatMap((k) => cell(k).slice(0, 2)).filter((x) => x != null) : [];
  const bySector = !secVals.length ? "" :
    `<section class="cp-sec"><h3>${t.bySector}</h3><p class="cp-base">${t.ind[i]} · ${t.base[baseOf(i)]}</p><ul>` +
    ["all", ...SECTORS.slice(1).sort(desc((k) => cell(k)[0]))].map((k) =>
      prow(`data-n="${k}"`, k === n, k === "all" ? t.sectorAll : t.sectors[k], ...cell(k), ceil10(secVals))).join("") + "</ul></section>";
  const sections = GROUPS.map((g) => {
    // rows: every indicator with a value in any year the selector offers, so the card keeps its rows while the years play;
    // highest first, ties broken by EU27 value
    const items = g.items.filter((k) => yearsOf(i).some((yy) => val(k, c, s, yy) != null || val(k, "EU27", s, yy) != null))
      .sort((a, b) => desc((k) => val(k, c, s, y))(a, b) || desc((k) => val(k, "EU27", s, y))(a, b));
    const vals = items.flatMap((k) => [val(k, c, s, y), val(k, "EU27", s, y)]).filter((x) => x != null);
    if (!items.length) return `<section class="cp-sec"><h3>${t.groups[g.id]}</h3><p class="note">${t.notSurveyed(y)}</p></section>`;
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
  const at = (sel) => e.target.closest(sel);
  if (at("#back")) return set({ c: null });
  if (at("#cpLink")) return copyLink(at("#cpLink"));
  if (at("#cpImg")) return saveCard(state.c);
  if (at("#cpCmp")) { toggleCmp(state.c); return $("cpCmp")?.focus({ preventScroll: true }); }
  if (at("#cpCmpGo")) return goCmp();
  const col = at(".tcol");
  if (col) { if (timer) stop(); return set({ y: col.dataset.y }); }
  const b = at(".prow");
  if (!b) return;
  const { n, i } = b.dataset, again = n ? `[data-n="${n}"]` : `[data-i="${i}"]`;
  set(n ? { n } : { i });
  $("profile").querySelector(`.prow${again}`)?.focus({ preventScroll: true }); // keep keyboard focus on the row
});
// the trend's legend follows the hovered year, then returns to the selected one
$("profile").addEventListener("pointerover", (e) => { const col = e.target.closest(".tcol"); if (col) $("tleg").innerHTML = tleg(state.c, col.dataset.y); });
$("profile").addEventListener("pointerout", (e) => {
  if (e.target.closest(".tcol") && !e.relatedTarget?.closest?.(".tcol") && $("tleg")) $("tleg").innerHTML = tleg(state.c, state.y);
});

// ---- small vs large enterprises: a row per country, one dot per size class ----
let gapSort = "gap", gapFor = null;
const GROW = 26; // row height, px
const gapSec = $("gapSec"), gapTip = $("gapTip");
const sizesAt = (c, y) => BANDS.map((b) => val(state.i, c, b, y, "all"));
const sizesOf = (c) => sizesAt(c, state.y);
const gapOf = (c) => { const [sm, , lg] = sizesOf(c); return lg - sm; };
const hasGapAt = (c, y) => { const [sm, , lg] = sizesAt(c, y); return sm != null && lg != null; };
const hasGap = (c) => hasGapAt(c, state.y);
function gapHtml(c) {
  const vs = sizesOf(c);
  return `<span class="m ind">${t.ind[state.i]}, ${state.y}</span><b>${c === "EU27" ? t.eu : name(c)}</b>` +
    BANDS.map((b, j) => `<br>${t.sizes[b]} <span class="m">${SIZE_RANGE[b]}</span> ${vs[j] == null ? t.noData : pct(vs[j])}`).join("") +
    `<br>${t.gap}: <b>${hasGap(c) ? pp(vs[2] - vs[0]) : t.noData}</b>`;
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
  const eu = d3.select("#gapEu").datum("EU27"), euGap = hasGap("EU27"); // reference row, pinned on top; "–" when a size has no EU27 value
  eu.select(".trk").style("visibility", euGap ? null : "hidden");
  if (euGap) place(eu); else eu.select(".val").text("–");
  const li = d3.select("#gapList").style("height", `${most(hasGapAt) * GROW}px`)
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
  byYear($("gapNote"), (yy) => { const m = covered.filter((c) => !hasGapAt(c, yy)).map(name); return m.length ? `${t.gapMissing(yy)} ${m.join(", ")}.` : ""; });
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
// the title opens and closes the section; closed, its rows leave the tab order
function setGapOpen(open) {
  $("gapFold").setAttribute("aria-expanded", open);
  $("gapPanel").classList.toggle("shut", !open);
  $("gapPanel").inert = !open;
  if (!open) hideGapTip();
}
$("gapFold").addEventListener("click", () => setGapOpen($("gapFold").getAttribute("aria-expanded") !== "true"));

// ---- share: the whole view lives in the URL; copy it and say so ----
let sayT;
function say(msg) { // a short-lived status line, read out by screen readers
  const el = $("say");
  el.textContent = msg;
  clearTimeout(sayT); sayT = setTimeout(() => (el.textContent = ""), 2400);
}
async function copyLink(btn) {
  let ok = true;
  try { await navigator.clipboard.writeText(location.href); } catch { ok = false; }
  say(ok ? t.copied : t.copyFail);
  btn.classList.toggle("ok", ok);
  clearTimeout(btn.okT); btn.okT = setTimeout(() => btn.classList.remove("ok"), 1600);
}
$("share").addEventListener("click", (e) => copyLink(e.currentTarget));
function download(blob, file) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: file });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---- share card: the open country as a 1200x630 PNG, drawn in the page's font, always on the light palette ----
const CARD = { paper: "#f5f6f8", panel: "#ffffff", ink: "#0f1a2e", muted: "#4f5a6c", faint: "#8a93a3", line: "#e1e5ec", eu: "#b7791f", euInk: "#94600f", c: "#4a5fc1" };
async function saveCard(c) {
  const { i, s, y, n } = state, W = 1200, H = 630, L = 72, F = '"Schibsted Grotesk", system-ui, sans-serif';
  await Promise.all([400, 500, 700].map((w) => document.fonts.load(`${w} 16px "Schibsted Grotesk"`)));
  const cv = Object.assign(document.createElement("canvas"), { width: W * 2, height: H * 2 }), g = cv.getContext("2d");
  g.scale(2, 2);
  const font = (size, weight) => (g.font = `${weight} ${size}px ${F}`);
  const txt = (str, x, y0, size, weight = 400, color = CARD.ink, align = "left") => {
    font(size, weight); g.fillStyle = color; g.textAlign = align; g.fillText(str, x, y0); return g.measureText(str).width; };
  const wrap = (str, w, size, weight) => { // greedy, by words
    font(size, weight);
    return str.split(" ").reduce((out, word) => {
      const ln = out.at(-1) ? `${out.at(-1)} ${word}` : word;
      if (g.measureText(ln).width <= w || !out.at(-1)) out[out.length - 1] = ln; else out.push(word);
      return out;
    }, [""]);
  };
  const fit = (str, w, size, weight) => { font(size, weight); while (size > 30 && g.measureText(str).width > w) font((size -= 2), weight); return size; };
  g.fillStyle = CARD.paper; g.fillRect(0, 0, W, H);

  // left: who, what, how much
  const colW = 520;
  const w0 = txt("AI Adoption Map", L, 84, 20, 700);
  txt(" · Eurostat", L + w0, 84, 20, 400, CARD.muted);
  txt(name(c), L, 160, fit(name(c), colW, 56, 700), 700);
  let yy = 210;
  for (const ln of wrap(t.ind[i], colW, 26, 500).slice(0, 2)) { txt(ln, L, yy, 26, 500); yy += 34; }
  for (const ln of wrap(`${t.base[baseOf(i)]} · ${cap(scope())} · ${y}`, colW, 19, 400).slice(0, 2)) { txt(ln, L, yy - 4, 19, 400, CARD.muted); yy += 26; }
  const v = val(i, c, s, y), eu = val(i, "EU27", s, y), rk = rows.indexOf(c);
  txt(v == null ? t.noData : pct(v), L - 4, yy + 96, v == null ? 64 : 112, 700);
  yy += 146;
  if (eu != null) {
    g.fillStyle = CARD.eu; g.beginPath(); g.arc(L + 6, yy - 7, 6, 0, 2 * Math.PI); g.fill();
    const w1 = txt(`${t.euAvg} `, L + 22, yy, 21, 400, CARD.muted);
    txt(pct(eu), L + 22 + w1, yy, 21, 700, CARD.euInk);
  }
  if (v != null && rk >= 0) txt(`${t.rank} ${rk + 1}/${rows.length}`, L, yy + 34, 21, 400, CARD.muted);

  // right: the trend, in a white panel like the site's
  const P = { x: 640, y: 64, w: 488, h: 432 }, tr = trendOf(c);
  if (tr) { // an indicator surveyed in one year only has no trend: the right side stays empty
    g.fillStyle = CARD.panel; g.strokeStyle = CARD.line; g.lineWidth = 1;
    g.beginPath(); g.roundRect(P.x + 0.5, P.y + 0.5, P.w, P.h, 16); g.fill(); g.stroke();
    const { a, b, top, cs, es } = tr, box = { l: P.x + 32, r: P.x + P.w - 70, t: P.y + 92, b: P.y + P.h - 60 };
    const X = (yr) => box.l + ((yr - a) / (b - a)) * (box.r - box.l), Y = (x) => box.b - (x / top) * (box.b - box.t);
    txt(t.trend, P.x + 32, P.y + 44, 19, 700);
    let lx = P.x + 32;
    for (const [nm, col] of [[name(c), CARD.c], [t.eu, CARD.eu]]) {
      g.fillStyle = col; g.fillRect(lx, P.y + 64, 18, 3);
      lx += 26 + txt(nm, lx + 26, P.y + 70, 16, 500, CARD.muted) + 22;
    }
    for (const gv of [0, top / 2, top]) {
      g.fillStyle = CARD.line; g.fillRect(box.l, Math.round(Y(gv)), box.r - box.l, 1);
      txt(`${num(gv)}%`, box.r + 12, Y(gv) + 5, 14, 400, CARD.muted);
    }
    for (const yr of d3.range(a, b + 1)) {
      const has = yearsOf(i).includes(String(yr)), on = String(yr) === y;
      txt(String(yr), X(yr), box.b + 32, 15, on ? 700 : 400, on ? CARD.ink : has ? CARD.muted : CARD.faint, "center");
    }
    for (const [p, col] of [[es, CARD.eu], [cs, CARD.c]]) {
      g.strokeStyle = col; g.lineWidth = 3; g.lineCap = "round";
      for (const [p0, p1, dashed] of segs(p)) {
        g.setLineDash(dashed ? [2, 7] : []); g.beginPath(); g.moveTo(X(p0[0]), Y(p0[1])); g.lineTo(X(p1[0]), Y(p1[1])); g.stroke();
      }
      g.setLineDash([]);
      for (const [yr, x] of p) {
        g.fillStyle = col; g.strokeStyle = CARD.panel; g.lineWidth = 3;
        g.beginPath(); g.arc(X(yr), Y(x), String(yr) === y ? 7 : 5, 0, 2 * Math.PI); g.fill(); g.stroke();
      }
    }
  }

  // footer: source and address
  g.fillStyle = CARD.line; g.fillRect(L, 548, W - 2 * L, 1);
  txt(`${t.source} Eurostat, ${n === "all" ? "isoc_eb_ai" : "isoc_eb_ain2"}, ${t.extracted} ${data.extractedAt}`, L, 588, 17, 400, CARD.muted);
  txt(SITE_URL.replace(/^https:\/\/|\/$/g, ""), W - L, 588, 17, 500, CARD.ink, "right");
  cv.toBlob((blob) => { if (blob) { download(blob, `ai-adoption-${c}-${i}-${y}.png`); say(t.saved); } }, "image/png");
}

// ---- indicator definition: Eurostat's own wording, the base, years, coverage and code ----
const dsOf = () => (state.n === "all" ? ["isoc_eb_ai", data.sourceUrl] : ["isoc_eb_ain2", sect.sourceUrl]);
function defHtml() {
  const { i, s, y } = state, m = i === "any" ? data : data.more[i], code = m.code ?? data.codes.indic_is, unit = m.unit ?? data.codes.unit;
  // labels that count technologies end with their codes ("...: AI_TTM, AI_TSR, ..."): list them by name instead
  const label = m.label.replace(/\s+/g, " "), parts = label.match(/^(.*?:)\s*((?:E_)?AI_\w+(?:,\s*(?:E_)?AI_\w+)*)$/);
  const techs = parts ? parts[2].split(/,\s*/).map((x) => x.replace(/^(E_)?AI_/, "").toLowerCase()).filter((k) => t.ind[k]) : [];
  const [ds, dsUrl] = dsOf(), cover = covered.filter((c) => val(i, c, s, y) != null).length;
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
  return `<p class="def-base">${t.base[baseOf(i)]}</p>` +
    `<h3>${t.defOfficial}</h3><p class="def-q" lang="en">${parts ? parts[1] : label}</p>` +
    (techs.length ? `<p class="def-sub">${t.defTechs}</p><ul class="def-techs">${techs.map((k) => `<li>${t.ind[k]}</li>`).join("")}</ul>` : "") +
    `<dl class="def-dl"><dt>${t.defUnit}</dt><dd lang="en">${data.unitLabels[unit] ?? unit}</dd>` +
    `<dt>${t.defYears}</dt><dd>${yearsOf(i).join(", ")}</dd>` +
    `<dt>${t.defCover}</dt><dd>${t.defCover2(cover, covered.length, y, scope())}</dd>` +
    `<dt>${t.defCode}</dt><dd><code>${code}</code>, ${link(dsUrl, `<code>${ds}</code>`)}</dd></dl>` +
    [t.groupNote[IND[i].id], state.n !== "all" && t.sectorNote, SKIPPED.length && t.skipped(SKIPPED.join(", "))]
      .filter(Boolean).map((x) => `<p class="note">${x}</p>`).join("") +
    `<h3>${t.defAI}</h3><p class="def-q" lang="en">${AI_DEF}</p>` +
    `<p class="def-links">${link(AI_DEF_URL, t.defArticle)} · ${link(META_URL, t.defMeta)}</p>`;
}
const def = $("def");
$("info").addEventListener("click", () => { $("defTitle").textContent = t.ind[state.i]; $("defBody").innerHTML = defHtml(); def.showModal(); });
$("defClose").addEventListener("click", () => def.close());
def.addEventListener("click", (e) => { if (e.target === def) def.close(); }); // a click on the backdrop

// ---- compare: 2 to 4 countries side by side on every indicator ----
const TRY = ["DE", "FR", "IT", "ES"];
const byName = (a, b) => name(a).localeCompare(name(b), state.l);
const toggleCmp = (c) => set({ k: state.k.includes(c) ? state.k.filter((x) => x !== c) : [...state.k, c].slice(0, MAXK) });
function goCmp() {
  $("cmpSec").scrollIntoView({ behavior: DUR ? "smooth" : "auto", block: "start" });
  $("cmpTitle").focus({ preventScroll: true });
}
function renderCmp() {
  const { k, y, s, i } = state, cols = [...k, "EU27"];
  $("cmpSub").textContent = `${cap(scope())} · ${y}`;
  $("cmpChips").innerHTML = k.map((c) => `<li>${name(c)}<button type="button" data-rm="${c}" aria-label="${t.cmpRemove(name(c))}">${ICON.x}</button></li>`).join("");
  const add = $("cmpAdd");
  add.innerHTML = `<option value="">${k.length >= MAXK ? t.cmpFull : `${t.cmpAdd}…`}</option>` +
    covered.filter((c) => !k.includes(c)).sort(byName).map((c) => `<option value="${c}">${name(c)}</option>`).join("");
  add.disabled = k.length >= MAXK;
  if (!k.length) {
    $("cmpBody").innerHTML = `<div class="cmp-empty"><p>${t.cmpHint}</p><button class="pill" type="button" id="cmpTry">${t.cmpTry(TRY.map(name).join(", "))}</button></div>`;
    return;
  }
  const cell = (x, c, max) => {
    const v = val(x, c, s, y), f = flag(x, c, s, y);
    return `<td${c === "EU27" ? ' class="eu"' : ""}><span class="v">${v == null ? "–" : pct(v)}${f ? `<abbr title="${t.note}: ${flagText(f)}">*</abbr>` : ""}</span>` +
      `<span class="cb">${v == null ? "" : `<i style="width:${(v / max) * 100}%"></i>`}</span></td>`;
  };
  const groups = GROUPS.map((g) => {
    // rows: every indicator with a value in any year the selector offers, so the table keeps its rows while the years play
    const items = g.items.filter((x) => yearsOf(i).some((yy) => cols.some((c) => val(x, c, s, yy) != null)));
    const vals = items.flatMap((x) => cols.map((c) => val(x, c, s, y))).filter((v) => v != null);
    if (!items.length) return "";
    const max = ceil10(vals);
    return `<tbody><tr class="grp"><th colspan="${cols.length + 1}" scope="colgroup">${t.groups[g.id]}<small>${t.base[g.base]}</small></th></tr>` +
      items.map((x) => `<tr${x === i ? ' class="cur"' : ""}><th scope="row"><button class="cmp-i" type="button" data-i="${x}" aria-current="${x === i}">` +
        `${t.short[x] ?? t.ind[x]}${baseOf(x) !== g.base ? `<small>${t.base[baseOf(x)]}</small>` : ""}</button></th>` +
        cols.map((c) => cell(x, c, max)).join("") + "</tr>").join("") + "</tbody>";
  }).join("");
  $("cmpBody").innerHTML = (k.length < 2 ? `<p class="note cmp-one">${t.cmpOne}</p>` : "") +
    `<table class="cmp" style="--cols:${cols.length}"><colgroup><col class="lab">${cols.map(() => "<col>").join("")}</colgroup>` +
    `<thead><tr><td></td>${cols.map((c) => `<th scope="col"${c === "EU27" ? ' class="eu"' : ""}>${c === "EU27" ? t.eu : name(c)}</th>`).join("")}</tr></thead>${groups}</table>`;
}
$("cmpChips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-rm]");
  if (b) { set({ k: state.k.filter((x) => x !== b.dataset.rm) }); $("cmpAdd").focus(); }
});
$("cmpAdd").addEventListener("change", (e) => { if (e.target.value) set({ k: [...state.k, e.target.value].slice(0, MAXK) }); });
$("cmpBody").addEventListener("click", (e) => {
  if (e.target.closest("#cmpTry")) return set({ k: TRY.filter((c) => covered.includes(c)) });
  const b = e.target.closest(".cmp-i");
  if (b) { set({ i: b.dataset.i }); $("cmpBody").querySelector(`.cmp-i[data-i="${b.dataset.i}"]`)?.focus({ preventScroll: true }); }
});

// ---- two indicators: a dot per country; the axes stay fixed across years, so the dots move as the years play ----
const xyBox = $("xy"), xySec = $("xySec"), xyTip = $("xyTip"), xySvg = d3.select("#xySvg");
const xyGrid = xySvg.append("g").attr("class", "xg"), xyRef = xySvg.append("g"), xyDots = xySvg.append("g");
let xyFor = null;
const xyAt = (c, y) => [val(state.sx, c, state.s, y), val(state.sy, c, state.s, y)];
const xyVals = (c) => xyAt(c, state.y);
const extentOf = (k) => d3.extent([...covered, "EU27"].flatMap((c) => yearsOf(k).map((y) => val(k, c, state.s, y))).filter((v) => v != null));
const xyName = (c) => (c === "EU27" ? t.eu : name(c));
const xyHtml = (c) => { const [a, b] = xyVals(c);
  return `<b>${xyName(c)}</b><br><span class="m">${t.ind[state.sx]}</span> ${pct(a)}<br><span class="m">${t.ind[state.sy]}</span> ${pct(b)}`; };
function renderXY() {
  const { s, y, sx, sy, c: open, k } = state;
  $("xyX").value = sx; $("xyY").value = sy;
  $("xySub").textContent = `${cap(scope())} · ${y}`;
  $("xyTy").textContent = `↑ ${t.ind[sy]} · ${t.base[baseOf(sy)]}`;
  $("xyTx").textContent = `${t.ind[sx]} · ${t.base[baseOf(sx)]} →`;
  const pts = covered.filter((c) => xyVals(c).every((v) => v != null));
  const both = yearsOf(sx).filter((yy) => yearsOf(sy).includes(yy) && yearsOf(state.i).includes(yy));
  byYear($("xyNote"), (yy) => {
    const p = covered.filter((c) => xyAt(c, yy).every((v) => v != null)), m = covered.filter((c) => !p.includes(c)).map(name);
    if (!p.length) return `${t.xyNone(yy)} ${both.length ? `${t.xyYears} ${both.map((b) => `<button class="linkish" type="button" data-y="${b}">${b}</button>`).join(" ")}` : ""}`;
    return m.length ? `${t.xyMissing} ${m.join(", ")}.` : "";
  });
  // a year without dots keeps its empty plot (the axes span every year), so the section keeps its height;
  // the plot goes only when an axis has no value in any year
  const drawn = extentOf(sx)[0] != null && extentOf(sy)[0] != null;
  xySvg.attr("display", drawn ? null : "none");
  if (!drawn) return hideXYTip();
  const w = xyBox.clientWidth, h = Math.round(Math.max(280, Math.min(440, w * 0.46))), m = { l: 42, r: 18, t: 12, b: 28 };
  const x = d3.scaleLinear().domain(extentOf(sx)).nice(w < 520 ? 4 : 6).range([m.l, w - m.r]);
  const yS = d3.scaleLinear().domain(extentOf(sy)).nice(5).range([h - m.b, m.t]);
  xySvg.attr("width", w).attr("height", h).attr("viewBox", `0 0 ${w} ${h}`);
  // recessive grid with values on the left and bottom edges
  const tick = (cls, data, line, label) => xyGrid.selectAll(`.${cls}`).data(data, (d) => d)
    .join((e) => e.append("g").attr("class", cls).call((g) => { g.append("line"); g.append("text"); }))
    .call((g) => line(g.select("line"))).call((g) => label(g.select("text").text((d) => `${num(d)}%`)));
  tick("gy", yS.ticks(5), (l) => l.attr("x1", m.l).attr("x2", w - m.r).attr("y1", yS).attr("y2", yS),
    (tx) => tx.attr("x", m.l - 8).attr("y", (d) => yS(d) + 4).attr("text-anchor", "end"));
  tick("gx", x.ticks(w < 520 ? 4 : 6), (l) => l.attr("x1", x).attr("x2", x).attr("y1", m.t).attr("y2", h - m.b),
    (tx) => tx.attr("x", x).attr("y", h - m.b + 18).attr("text-anchor", "middle"));
  // the EU27 as two dashed reference lines
  const [ex, ey] = xyVals("EU27"), eu = ex != null && ey != null;
  xyRef.selectAll("line").data(eu ? ["v", "h"] : []).join("line").attr("class", "eul")
    .transition().duration(DUR).ease(d3.easeCubicInOut)
    .attr("x1", (d) => (d === "v" ? x(ex) : m.l)).attr("x2", (d) => (d === "v" ? x(ex) : w - m.r))
    .attr("y1", (d) => (d === "v" ? m.t : yS(ey))).attr("y2", (d) => (d === "v" ? h - m.b : yS(ey)));
  // labels: right, left, above or below the dot, wherever no other dot or label sits; else none (the tooltip names it)
  const all = eu ? ["EU27", ...pts] : pts, at = (c) => [x(xyVals(c)[0]), yS(xyVals(c)[1])];
  const taken = all.map((c) => { const [px, py] = at(c); return [px - 6, py - 6, px + 6, py + 6]; });
  const free = (r) => r[0] >= m.l - 4 && r[2] <= w && r[1] >= 0 && r[3] <= h - m.b + 4 &&
    !taken.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
  const place = {};
  for (const c of all) {
    const [px, py] = at(c), tw = xyName(c === "EU27" ? c : "XX").length * 6.6;
    const o = [[8, 4, "start", [px + 8, py - 6, px + 8 + tw, py + 5]], [-8, 4, "end", [px - 8 - tw, py - 6, px - 8, py + 5]],
      [0, -9, "middle", [px - tw / 2, py - 19, px + tw / 2, py - 8]], [0, 17, "middle", [px - tw / 2, py + 7, px + tw / 2, py + 18]]].find((q) => free(q[3]));
    if (o) { taken.push(o[3]); place[c] = o; }
  }
  const sel = xyDots.selectAll(".pt").data(all, (d) => d)
    .join((e) => e.append("g").attr("class", "pt").attr("transform", (d) => `translate(${at(d)})`)
      .call((g) => { g.append("circle"); g.append("text"); }));
  sel.classed("eu", (d) => d === "EU27").classed("sel", (d) => d === open || k.includes(d))
    .attr("tabindex", (d) => (d === "EU27" ? null : 0)).attr("role", (d) => (d === "EU27" ? null : "button"))
    .attr("aria-label", (d) => `${xyName(d)}: ${t.ind[sx]} ${pct(xyVals(d)[0])}, ${t.ind[sy]} ${pct(xyVals(d)[1])}`);
  sel.transition().duration(DUR).ease(d3.easeCubicInOut).attr("transform", (d) => `translate(${at(d)})`);
  sel.select("circle").attr("r", (d) => (d === "EU27" ? 6 : 5));
  sel.select("text").text((d) => (d === "EU27" ? t.eu : d)).attr("display", (d) => (place[d] ? null : "none"))
    .attr("x", (d) => place[d]?.[0] ?? 0).attr("y", (d) => place[d]?.[1] ?? 0).attr("text-anchor", (d) => place[d]?.[2] ?? "start");
  sel.filter((d) => d === "EU27").raise();
  if (xyFor) { if (all.includes(xyFor)) xyTip.innerHTML = xyHtml(xyFor); else hideXYTip(); }
}
function showXYTip(c, el) {
  xyFor = c; xyTip.innerHTML = xyHtml(c); xyTip.hidden = false;
  const box = xySec.getBoundingClientRect(), r = el.getBoundingClientRect();
  const left = Math.min(Math.max(r.left - box.left + 16, 4), box.width - xyTip.offsetWidth - 4);
  const above = r.top - box.top - xyTip.offsetHeight - 8;
  Object.assign(xyTip.style, { left: `${left}px`, top: `${above > 4 ? above : r.bottom - box.top + 8}px` });
}
function hideXYTip() { xyFor = null; xyTip.hidden = true; }
const xyPt = (e) => { const p = e.target.closest?.(".pt"); return p ? [p, d3.select(p).datum()] : []; };
d3.select("#xySvg")
  .on("pointerover", (e) => { const [p, c] = xyPt(e); if (p) showXYTip(c, p); })
  .on("pointerleave", (e) => { if (e.pointerType === "mouse") hideXYTip(); })
  .on("focusin", (e) => { const [p, c] = xyPt(e); if (p) showXYTip(c, p); })
  .on("focusout", hideXYTip)
  .on("click", (e) => { const [, c] = xyPt(e); if (c && c !== "EU27") { hideXYTip(); openCountry(c, true); } })
  .on("keydown", (e) => { const [, c] = xyPt(e); if (c && c !== "EU27" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openCountry(c, true); } });
$("xyX").addEventListener("change", (e) => set({ sx: e.target.value }));
$("xyY").addEventListener("change", (e) => set({ sy: e.target.value }));
$("xyNote").addEventListener("click", (e) => { const b = e.target.closest("[data-y]"); if (b) set({ y: b.dataset.y }); });
let xyQueued = false; // redraw at the new width
new ResizeObserver(() => { if (!xyQueued) { xyQueued = true; requestAnimationFrame(() => { xyQueued = false; renderXY(); }); } }).observe(xyBox);

// ---- data table of the current view, and the same as CSV ----
const tableOrder = () => { const { i, s, y } = state;
  return ["EU27", ...covered.slice().sort((a, b) => desc((c) => val(i, c, s, y))(a, b) || byName(a, b))]; };
function renderData() {
  const { i, s, y } = state, ys = yearsOf(i), seen = new Set();
  $("dataSub").textContent = `${t.ind[i]} · ${t.base[baseOf(i)]} · ${cap(scope())}`;
  $("dataSum").textContent = t.showTable(covered.length, ys[0], ys.at(-1));
  const cur = (yy) => (yy === y ? ' class="cur"' : "");
  const cell = (c, yy) => { const v = val(i, c, s, yy), f = flag(i, c, s, yy);
    if (f) seen.add(f);
    return `<td${cur(yy)}>${v == null ? "–" : pct(v)}${f ? `<sup title="${flagText(f)}">${f}</sup>` : ""}</td>`; };
  $("dataTbl").innerHTML = `<caption class="sr-only">${t.ind[i]}, ${t.base[baseOf(i)]}, ${scope()}</caption>` +
    `<thead><tr><th scope="col">${t.country}</th>${ys.map((yy) => `<th scope="col"${cur(yy)}>${yy}</th>`).join("")}</tr></thead><tbody>` +
    tableOrder().map((c) => `<tr${c === "EU27" ? ' class="eu"' : ""}><th scope="row">${c === "EU27" ? t.eu : name(c)}</th>${ys.map((yy) => cell(c, yy)).join("")}</tr>`).join("") +
    "</tbody>";
  $("dataNote").textContent = [t.dataNote, ...[...seen].map((f) => `${f}: ${flagText(f)}`)].join(" ");
}
// CSV in the page language's convention: "," and 1.5 in English, ";" and 1,5 in Italian (what Excel expects there)
function saveCsv() {
  const { i, s, n, l } = state, ys = yearsOf(i), sep = l === "it" ? ";" : ",";
  const q = (x) => (x.includes(sep) || /["\r\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x); // quote only what needs it
  const num0 = (v) => (v == null ? "" : l === "it" ? String(v).replace(".", ",") : String(v));
  const lines = [[t.code, t.country, ...ys, t.notes], ...tableOrder().map((c) => [c, c === "EU27" ? t.eu : name(c),
    ...ys.map((yy) => num0(val(i, c, s, yy))),
    ys.map((yy) => flag(i, c, s, yy) && `${yy}: ${flagText(flag(i, c, s, yy))}`).filter(Boolean).join("; ")])];
  const code = i === "any" ? data.codes.indic_is : data.more[i].code;
  const scopeCode = n === "all" ? Object.keys(data.codes.size_emp).find((k) => data.codes.size_emp[k] === s) : `nace-${n}`;
  const text = "\uFEFF" + lines.map((r) => r.map((x) => q(String(x))).join(sep)).join("\r\n") + "\r\n"; // BOM: Excel reads UTF-8
  download(new Blob([text], { type: "text/csv;charset=utf-8" }), `ai-adoption_${code}_${scopeCode}.csv`);
}
$("csv").addEventListener("click", saveCsv);

// ---- guided tour: six facts, each computed from the data and shown on the page ----
let tourK = -1, marks = [];
function tourSteps() {
  const any = (c, y, s = "all", n = "all") => val("any", c, s, y, n);
  const ys = yearsOf("any", "all"), a = ys[0], b = ys.at(-1), base = { i: "any", s: "all", n: "all", y: b, c: null };
  const desc2 = (p, q) => q[1] - p[1];
  const spread = covered.map((c) => [c, any(c, b)]).filter(([, v]) => v != null).sort(desc2), hi = spread[0], lo = spread.at(-1);
  const secs = SECTORS.slice(1).map((n) => [n, any("EU27", b, "all", n)]).filter(([, v]) => v != null).sort(desc2);
  const topOf = (id, y) => { const g = GROUPS.find((x) => x.id === id);
    return g.items.filter((k) => baseOf(k) === g.base).map((k) => [k, val(k, "EU27", "all", y, "all")]).filter(([, v]) => v != null).sort(desc2)[0]; };
  const tech = topOf("tech", b), by = yearsOf("ble", "all").findLast((y) => topOf("barrier", y)), bar = topOf("barrier", by);
  return [
    { text: t.st.growth(a, pct(any("EU27", a)), b, pct(any("EU27", b))), set: base, to: ".pulse" },
    { text: t.st.spread(b, pct(lo[1]), name(lo[0]), pct(hi[1]), name(hi[0])), set: base, to: ".grid", mark: [lo[0], hi[0]] },
    { text: t.st.size(b, pct(any("EU27", b, "large")), pct(any("EU27", b, "small"))), set: base, to: "#gapSec" },
    { text: t.st.sector(b, pct(secs[0][1]), t.sectors[secs[0][0]], pct(secs.at(-1)[1]), t.sectors[secs.at(-1)[0]]), set: { ...base, n: secs[0][0] }, to: ".grid" },
    { text: t.st.tech(b, t.ind[tech[0]], pct(tech[1])), set: { ...base, i: tech[0] }, to: ".grid" },
    { text: t.st.barrier(by, t.ind[bar[0]], pct(bar[1])), set: { ...base, i: bar[0], y: by }, to: ".grid" },
  ];
}
function paintStep() { // the words only, e.g. after a language switch
  const steps = tourSteps(), last = tourK === steps.length - 1;
  $("tourStep").textContent = `${tourK + 1}/${steps.length}`;
  $("tourText").textContent = steps[tourK].text;
  $("tourPrev").textContent = `← ${t.tourPrev}`;
  $("tourPrev").disabled = !tourK;
  $("tourNext").textContent = last ? t.tourDone : `${t.tourNext} →`;
}
function showStep(k) {
  const st = tourSteps()[k];
  tourK = k;
  if (timer) stop();
  set(st.set);
  marks = st.mark ?? [];
  ctry.classed("mark", (f) => marks.includes(byNum[f.id]));
  $("tour").hidden = false;
  document.body.classList.add("touring");
  paintStep();
  if (st.to === "#gapSec") setGapOpen(true); // the tour talks about this chart: show it
  document.querySelector(st.to).scrollIntoView({ behavior: DUR ? "smooth" : "auto", block: "start" });
}
function endTour() {
  tourK = -1; marks = [];
  ctry.classed("mark", false);
  $("tour").hidden = true;
  document.body.classList.remove("touring");
  $("tourBtn").focus({ preventScroll: true });
}
$("tourBtn").addEventListener("click", () => { showStep(0); $("tourNext").focus({ preventScroll: true }); });
$("tourNext").addEventListener("click", () => (tourK >= tourSteps().length - 1 ? endTour() : showStep(tourK + 1)));
$("tourPrev").addEventListener("click", () => { showStep(tourK - 1); if ($("tourPrev").disabled) $("tourNext").focus({ preventScroll: true }); });
$("tourClose").addEventListener("click", endTour);

// ---- find a country: the names that match, in the page language, in a short list under the field ----
const fold = (x) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const find = $("find"), findList = $("findList");
let hits = [], active = -1;
function matches(q) { // exact name or code first, then the start of a name, then anywhere in it; A-Z within each
  const f = fold(q), rank = (c) => { const nm = fold(name(c)); return nm === f || fold(c) === f ? 0 : nm.startsWith(f) ? 1 : nm.includes(f) ? 2 : 3; };
  return covered.map((c) => [rank(c), c]).filter(([r]) => r < 3)
    .sort(([ra, a], [rb, b]) => ra - rb || name(a).localeCompare(name(b), document.documentElement.lang)).map(([, c]) => c);
}
function pickOption(k) { // highlight option k (-1: none) and scroll it into the list's view
  active = k;
  [...findList.children].forEach((li, j) => li.setAttribute("aria-selected", j === k));
  const li = findList.children[k];
  if (!li) return find.removeAttribute("aria-activedescendant");
  find.setAttribute("aria-activedescendant", li.id);
  if (li.offsetTop < findList.scrollTop) findList.scrollTop = li.offsetTop - 4;
  else if (li.offsetTop + li.offsetHeight > findList.scrollTop + findList.clientHeight) findList.scrollTop = li.offsetTop + li.offsetHeight - findList.clientHeight + 4;
}
function suggest(q, k = q.trim() ? 0 : -1) { // with text typed, the first match is highlighted and Enter takes it
  hits = matches(q);
  findList.innerHTML = hits.map((c) => `<li role="option" id="find-${c}" data-c="${c}">${name(c)}</li>`).join("");
  findList.hidden = !hits.length; find.setAttribute("aria-expanded", hits.length > 0);
  findList.scrollTop = 0; pickOption(k);
}
function closeList() { findList.hidden = true; find.setAttribute("aria-expanded", false); pickOption(-1); }
function go(c) { find.value = ""; find.setCustomValidity(""); closeList(); openCountry(c); }
find.addEventListener("input", () => {
  find.setCustomValidity("");
  const c = covered.find((x) => fold(name(x)) === fold(find.value)); // a whole name typed
  if (c) go(c); else if (find.value.trim()) suggest(find.value); else closeList();
});
find.addEventListener("click", () => findList.hidden && suggest(find.value));
find.addEventListener("blur", closeList);
find.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (findList.hidden) suggest(find.value, 0);
    else pickOption(Math.min(Math.max(active + (e.key === "ArrowDown" ? 1 : -1), 0), hits.length - 1));
    return;
  }
  // Esc closes the list and keeps the text (and the open profile); a second Esc clears the field as usual
  if (e.key === "Escape" && !findList.hidden) { e.preventDefault(); e.stopPropagation(); closeList(); return; }
  if (e.key !== "Enter") return;
  e.preventDefault();
  const c = hits[active] ?? (find.value.trim() ? matches(find.value)[0] : null);
  if (c) go(c);
  else if (find.value.trim()) { find.setCustomValidity(t.findNone(find.value.trim())); find.reportValidity(); }
});
findList.addEventListener("mousedown", (e) => e.preventDefault()); // a click in the list keeps the focus in the field
findList.addEventListener("click", (e) => { const li = e.target.closest("li"); if (li) go(li.dataset.c); });

// ---- keyboard: ←/→ year, Space play/pause, / or Cmd/Ctrl+K find; ignored while typing in a field ----
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); find.focus(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey || def.open || e.target.closest?.("input, select, textarea, [contenteditable]")) return;
  if (e.key === "/") { e.preventDefault(); find.focus(); return; }
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const ys = yearsOf(state.i), y = ys[ys.indexOf(state.y) + (e.key === "ArrowRight" ? 1 : -1)];
    if (y) { e.preventDefault(); if (timer) stop(); set({ y }); }
    return;
  }
  // Space plays only when no control has focus: on a button it still presses that button
  if (e.key === " " && !e.target.closest?.("a, button, summary, [tabindex]") && !$("play").disabled) { e.preventDefault(); $("play").click(); }
});

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
  $("euRef").innerHTML = `<span class="n"></span><span class="nm"><i class="eu-dot"></i><span>${t.euAvg}</span></span>` +
    `<span class="bar">${eu == null ? "" : `<span class="eu" style="left:${euLeft}"></span>`}</span><span class="val">${eu == null ? "–" : pct(eu)}</span>`;
  const at = (k) => `translateY(${k * ROW}px)`;
  const li = d3.select("#rankList").style("height", `${most((k, yy) => val(i, k, s, yy) != null) * ROW}px`)
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

  byYear($("missing"), (yy) => { const m = covered.filter((k) => val(i, k, s, yy) == null).map(name);
    return [m.length ? `${t.noDataFor(yy)} ${m.join(", ")}.` : "", covered.some((k) => flag(i, k, s, yy) && val(i, k, s, yy) != null) ? t.flagFoot : ""]
      .filter(Boolean).join(" "); });

  renderGap();
  renderXY();
  renderCmp();
  renderData();
}

// ---- controls ----
let timer = null;
// the label says what a click does: "Play", or "Pause" while playing (filled)
function syncPlay() { $("play").classList.toggle("on", !!timer); }
function stop() { clearInterval(timer); timer = null; syncPlay(); render(); }
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
  timer = setInterval(() => {
    const k = ys.indexOf(state.y);
    if (k >= ys.length - 1) return stop();
    set({ y: ys[k + 1] });
    if (k + 1 === ys.length - 1) stop();
  }, STEP_MS);
  syncPlay();
  if (state.y === ys.at(-1)) set({ y: ys[0] }); else render();
});
addEventListener("hashchange", () => { const v = state.v; readHash(); setLang(state.l); render(); if (state.v !== v) draw(); });

readHash();
setLang(state.l);
draw();
render();
if (state.v === "globe") spinIn();
