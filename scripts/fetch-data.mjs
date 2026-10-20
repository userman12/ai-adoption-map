// Downloads Eurostat isoc_eb_ai once and writes data/ai-adoption.json.
// Usage: node scripts/fetch-data.mjs   (Node 18+, no dependencies)
import { writeFileSync } from 'node:fs';

const API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ai?format=JSON&lang=EN';
const FILTER = { freq: 'A', nace_r2: 'C10-S951_X_K', indic_is: 'E_AI_TANY', unit: 'PC_ENT' };
const SIZES = { GE10: 'all', '10-49': 'small', '50-249': 'medium', GE250: 'large' };
const GEO = { EU27_2020: 'EU27', EL: 'GR', UK: 'GB' }; // Eurostat -> ISO alpha-2; others are identical
const SKIP_GEO = new Set(['EA']); // euro area: not a country, not EU27

const res = await fetch(API);
if (!res.ok) throw new Error(`Eurostat responded ${res.status}`);
const j = await res.json();

const codes = (d) => {
  const ix = j.dimension[d].category.index;
  return Object.keys(ix).sort((a, b) => ix[a] - ix[b]);
};
for (const [d, c] of Object.entries(FILTER)) {
  if (!codes(d).includes(c)) throw new Error(`Code ${c} not found in dimension ${d}`);
}

// JSON-stat: flat row-major index over j.id / j.size
const pos = (o) => j.id.reduce((p, d, i) => p * j.size[i] + j.dimension[d].category.index[o[d]], 0);

// Additional indicators, same dataset. unit = the base the percentage is computed on.
const MORE = {
  // technologies + intensity: % of all enterprises
  ...Object.fromEntries(['TTM', 'TSR', 'TNLG', 'TIR', 'TML', 'TPA', 'TAR', 'TPVSG', 'TGE2', 'TGE3']
    .map((k) => [k.toLowerCase(), { code: `E_AI_${k}`, unit: 'PC_ENT' }])),
  // purposes: % of enterprises using AI
  ...Object.fromEntries(['PMS', 'PPP', 'PBAM', 'PFIN', 'PLOG', 'PITS', 'PRDI']
    .map((k) => [k.toLowerCase(), { code: `E_AI_${k}`, unit: 'PC_ENT_AI_TANY' }])),
  // barriers: % of enterprises that considered AI but don't use it
  ...Object.fromEntries(['BCST', 'BLE', 'BINC', 'BDDT', 'BCDP', 'BLEG', 'BEC', 'BNU']
    .map((k) => [k.toLowerCase(), { code: `E_AI_${k}`, unit: 'PC_ENT_AI_EC' }])),
};

function extract(indic_is, unit) {
  for (const [d, c] of [['indic_is', indic_is], ['unit', unit]])
    if (!codes(d).includes(c)) throw new Error(`Code ${c} not found in dimension ${d}`);
  const values = {}, flags = {}, years = new Set();
  for (const geo of codes('geo')) {
    if (SKIP_GEO.has(geo)) continue;
    const key = GEO[geo] ?? geo;
    for (const [sizeCode, size] of Object.entries(SIZES)) {
      for (const time of codes('time')) {
        const p = pos({ ...FILTER, indic_is, unit, geo, size_emp: sizeCode, time });
        const v = j.value[p];
        if (v == null) continue; // missing stays absent, never 0
        ((values[key] ??= {})[size] ??= {})[time] = v;
        years.add(Number(time));
        const f = j.status?.[p];
        if (f) ((flags[key] ??= {})[size] ??= {})[time] = f;
      }
    }
  }
  return { years: [...years].sort((a, b) => a - b), values, flags };
}

const main = extract(FILTER.indic_is, FILTER.unit);
const more = Object.fromEntries(Object.entries(MORE).map(([k, { code, unit }]) => [k, { code, unit, ...extract(code, unit) }]));

const out = {
  source: 'Eurostat, isoc_eb_ai',
  sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table',
  extractedAt: new Date().toISOString().slice(0, 10),
  datasetUpdated: j.updated,
  indicator: 'Enterprises using at least one AI technology (% of enterprises)',
  codes: { ...FILTER, size_emp: SIZES },
  flagLabels: j.extension?.status?.label ?? {},
  years: main.years,
  sizeClasses: Object.values(SIZES),
  values: main.values,
  flags: main.flags,
  unitLabels: Object.fromEntries(codes('unit').map((u) => [u, j.dimension.unit.category.label[u]])),
  more,
};
writeFileSync(new URL('../data/ai-adoption.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote data/ai-adoption.json: ${Object.keys(main.values).length} areas, years ${out.years.join(', ')}, +${Object.keys(more).length} indicators`);
