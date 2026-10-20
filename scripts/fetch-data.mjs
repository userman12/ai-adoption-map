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

const values = {}, flags = {}, years = new Set();
for (const geo of codes('geo')) {
  if (SKIP_GEO.has(geo)) continue;
  const key = GEO[geo] ?? geo;
  for (const [sizeCode, size] of Object.entries(SIZES)) {
    for (const time of codes('time')) {
      const p = pos({ ...FILTER, geo, size_emp: sizeCode, time });
      const v = j.value[p];
      if (v == null) continue; // missing stays absent, never 0
      ((values[key] ??= {})[size] ??= {})[time] = v;
      years.add(Number(time));
      const f = j.status?.[p];
      if (f) ((flags[key] ??= {})[size] ??= {})[time] = f;
    }
  }
}

const out = {
  source: 'Eurostat, isoc_eb_ai',
  sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ai/default/table',
  extractedAt: new Date().toISOString().slice(0, 10),
  datasetUpdated: j.updated,
  indicator: 'Enterprises using at least one AI technology (% of enterprises)',
  codes: { ...FILTER, size_emp: SIZES },
  flagLabels: j.extension?.status?.label ?? {},
  years: [...years].sort((a, b) => a - b),
  sizeClasses: Object.values(SIZES),
  values,
  flags,
};
writeFileSync(new URL('../data/ai-adoption.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote data/ai-adoption.json: ${Object.keys(values).length} areas, years ${out.years.join(', ')}`);
