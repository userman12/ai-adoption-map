// Downloads Eurostat isoc_eb_ai (+ isoc_eb_ain2 for sectors) once and writes
// data/ai-adoption.json and data/ai-sectors.json.
// Usage: node scripts/fetch-data.mjs   (Node 18+, no dependencies)
import { writeFileSync } from 'node:fs';

const API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const FILTER = { freq: 'A', nace_r2: 'C10-S951_X_K', indic_is: 'E_AI_TANY', unit: 'PC_ENT' };
const SIZES = { GE10: 'all', '10-49': 'small', '50-249': 'medium', GE250: 'large' };
const GEO = { EU27_2020: 'EU27', EL: 'GR', UK: 'GB' }; // Eurostat -> ISO alpha-2; others are identical
const SKIP_GEO = new Set(['EA']); // euro area: not a country, not EU27

// Additional indicators, same datasets. unit = the base the percentage is computed on.
const MORE = {
  // technologies + intensity: % of all enterprises
  ...Object.fromEntries(['TTM', 'TSR', 'TNLG', 'TIR', 'TML', 'TPA', 'TAR', 'TPVSG', 'TGE2', 'TGE3']
    .map((k) => [k.toLowerCase(), { code: `E_AI_${k}`, unit: 'PC_ENT' }])),
  // purposes and how the AI was obtained: % of enterprises using AI (several answers possible)
  ...Object.fromEntries(['PMS', 'PPP', 'PBAM', 'PFIN', 'PLOG', 'PITS', 'PRDI', 'ARDY', 'AMOWN', 'AOS', 'ADOWN', 'AEXT']
    .map((k) => [k.toLowerCase(), { code: `E_AI_${k}`, unit: 'PC_ENT_AI_TANY' }])),
  // considered using AI: % of enterprises not using AI
  ec: { code: 'E_AI_EC', unit: 'PC_ENT_AI_TX' },
  // barriers: % of enterprises that considered AI but don't use it
  ...Object.fromEntries(['BCST', 'BLE', 'BINC', 'BDDT', 'BCDP', 'BLEG', 'BEC', 'BNU']
    .map((k) => [k.toLowerCase(), { code: `E_AI_${k}`, unit: 'PC_ENT_AI_EC' }])),
  // AI users by digital intensity level: % of ALL enterprises; the four levels add up to E_AI_TANY
  ...Object.fromEntries(['VLO', 'LO', 'HI', 'VHI']
    .map((k) => [`d${k.toLowerCase()}`, { code: `E_DI3_${k}_AI_TANY`, unit: 'PC_ENT' }])),
};
// NACE sections from isoc_eb_ain2. Eurostat publishes sector figures for 10+ employees only.
const SECTORS = ['C', 'D_E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N'];

async function load(id) {
  const res = await fetch(`${API}/${id}?format=JSON&lang=EN`);
  if (!res.ok) throw new Error(`Eurostat ${id} responded ${res.status}`);
  const j = await res.json();
  const codes = (d) => {
    const ix = j.dimension[d].category.index;
    return Object.keys(ix).sort((a, b) => ix[a] - ix[b]);
  };
  // JSON-stat: flat row-major index over j.id / j.size
  const pos = (o) => j.id.reduce((p, d, i) => p * j.size[i] + j.dimension[d].category.index[o[d]], 0);
  function extract(indic_is, unit, nace_r2 = FILTER.nace_r2, sizes = SIZES) {
    for (const [d, c] of [['indic_is', indic_is], ['unit', unit], ['nace_r2', nace_r2], ...Object.keys(sizes).map((s) => ['size_emp', s])])
      if (!codes(d).includes(c)) throw new Error(`Code ${c} not found in dimension ${d} of ${id}`);
    const values = {}, flags = {}, years = new Set();
    for (const geo of codes('geo')) {
      if (SKIP_GEO.has(geo)) continue;
      const key = GEO[geo] ?? geo;
      for (const [sizeCode, size] of Object.entries(sizes)) {
        for (const time of codes('time')) {
          const p = pos({ ...FILTER, indic_is, unit, nace_r2, geo, size_emp: sizeCode, time });
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
  return { j, codes, extract, label: (d, c) => j.dimension[d].category.label[c] };
}
const write = (file, out) => writeFileSync(new URL(`../data/${file}`, import.meta.url), JSON.stringify(out, null, 1) + '\n');
const today = new Date().toISOString().slice(0, 10);

const ai = await load('isoc_eb_ai');
for (const [d, c] of Object.entries(FILTER)) {
  if (!ai.codes(d).includes(c)) throw new Error(`Code ${c} not found in dimension ${d}`);
}
const main = ai.extract(FILTER.indic_is, FILTER.unit);
const more = Object.fromEntries(Object.entries(MORE).map(([k, { code, unit }]) => [k, { code, unit, ...ai.extract(code, unit) }]));
write('ai-adoption.json', {
  source: 'Eurostat, isoc_eb_ai',
  sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table',
  extractedAt: today,
  datasetUpdated: ai.j.updated,
  indicator: 'Enterprises using at least one AI technology (% of enterprises)',
  codes: { ...FILTER, size_emp: SIZES },
  flagLabels: ai.j.extension?.status?.label ?? {},
  years: main.years,
  sizeClasses: Object.values(SIZES),
  values: main.values,
  flags: main.flags,
  unitLabels: Object.fromEntries(ai.codes('unit').map((u) => [u, ai.label('unit', u)])),
  more,
});
console.log(`Wrote data/ai-adoption.json: ${Object.keys(main.values).length} areas, years ${main.years.join(', ')}, +${Object.keys(more).length} indicators`);

const ain2 = await load('isoc_eb_ain2');
const ALL = { any: { code: FILTER.indic_is, unit: FILTER.unit }, ...MORE };
write('ai-sectors.json', {
  source: 'Eurostat, isoc_eb_ain2',
  sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ain2/default/table',
  extractedAt: today,
  datasetUpdated: ain2.j.updated,
  note: 'Sector figures exist for enterprises with 10+ employees only, stored as size class "all".',
  sectorLabels: Object.fromEntries(SECTORS.map((n) => [n, ain2.label('nace_r2', n)])),
  sectors: Object.fromEntries(SECTORS.map((n) => [n, Object.fromEntries(Object.entries(ALL)
    .map(([k, { code, unit }]) => [k, { code, unit, ...ain2.extract(code, unit, n, { GE10: 'all' }) }]))])),
});
console.log(`Wrote data/ai-sectors.json: ${SECTORS.length} sectors x ${Object.keys(ALL).length} indicators`);
