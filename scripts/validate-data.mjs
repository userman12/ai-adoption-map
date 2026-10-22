// Checks data/ai-adoption.json and data/ai-sectors.json. Exits 1 on any error; warnings don't fail.
// Usage: node scripts/validate-data.mjs
import { readFileSync } from 'node:fs';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const d = read('ai-adoption.json'), sec = read('ai-sectors.json');
const errors = [], warnings = [];

// 1. every value is a number in [0, 100]: main indicator, extra indicators, sectors
const inRange = (label, values) => {
  for (const [geo, bySize] of Object.entries(values))
    for (const [size, byYear] of Object.entries(bySize))
      for (const [year, v] of Object.entries(byYear))
        if (typeof v !== 'number' || !(v >= 0 && v <= 100)) errors.push(`${label} ${geo} ${size} ${year}: ${v} is not a number in 0-100`);
};
inRange('main', d.values);
for (const [ind, m] of Object.entries(d.more ?? {})) {
  inRange(ind, m.values);
  if (!m.years.length || !m.values.EU27) errors.push(`${ind}: no EU27 values`);
}
// every sector carries every indicator the app can show, each with EU27 values
const keys = ['any', ...Object.keys(d.more)];
for (const [n, inds] of Object.entries(sec.sectors))
  for (const k of keys) {
    if (!inds[k]?.years.length || !inds[k].values.EU27) { errors.push(`sector ${n} ${k}: missing or no EU27 values`); continue; }
    inRange(`sector ${n} ${k}`, inds[k].values);
  }

// 2. EU27 "all" exists for every year
for (const y of d.years)
  if (d.values.EU27?.all?.[y] == null) errors.push(`EU27 all ${y}: missing`);

// 3. large >= small (warning only)
for (const [geo, s] of Object.entries(d.values))
  for (const y of d.years)
    if (s.small?.[y] != null && s.large?.[y] != null && s.large[y] < s.small[y])
      warnings.push(`${geo} ${y}: large ${s.large[y]} < small ${s.small[y]}`);

// 4. the four digital-intensity levels are shares of ALL enterprises and together make up the AI
//    adoption rate; the app says so. Single cells can be off (LT large 2023: 0.27 pp), but if many
//    are, the codes changed meaning.
let compared = 0, off = 0;
for (const [geo, bySize] of Object.entries(d.values))
  for (const [size, byYear] of Object.entries(bySize))
    for (const [y, v] of Object.entries(byYear)) {
      const parts = ['dvlo', 'dlo', 'dhi', 'dvhi'].map((k) => d.more[k]?.values[geo]?.[size]?.[y]);
      if (parts.some((p) => p == null)) continue;
      const sum = parts.reduce((a, b) => a + b, 0);
      compared++;
      if (Math.abs(sum - v) > 0.1) { off++; warnings.push(`digital intensity ${geo} ${size} ${y}: levels add up to ${sum.toFixed(2)}, AI adoption is ${v}`); }
    }
if (!compared || off / compared > 0.05) errors.push(`digital intensity: ${off} of ${compared} cells don't add up to AI adoption`);

// 5. spot checks against Eurostat's published 2025 figures (±0.5 pp), always on 2025
const SPOT = [
  ['EU27', 'all', 20.0], ['DK', 'all', 42.0], ['FI', 'all', 37.8], ['RO', 'all', 5.2],
  ['EU27', 'small', 17.0], ['EU27', 'medium', 30.4], ['EU27', 'large', 55.0],
];
for (const [geo, size, want] of SPOT) {
  const got = d.values[geo]?.[size]?.[2025];
  if (got == null || Math.abs(got - want) > 0.5)
    errors.push(`spot check ${geo} ${size} 2025: expected ~${want}, found ${got ?? 'missing'} (codes: ${JSON.stringify(d.codes)})`);
}
// sectors: EU27 information and communication (J) and construction (F), 2025, from isoc_eb_ain2
for (const [n, want] of [['J', 62.5], ['F', 10.8]]) {
  const got = sec.sectors[n]?.any?.values.EU27?.all?.[2025];
  if (got == null || Math.abs(got - want) > 0.5) errors.push(`spot check sector ${n} EU27 2025: expected ~${want}, found ${got ?? 'missing'}`);
}

for (const w of warnings) console.warn('WARN ', w);
for (const e of errors) console.error('ERROR', e);
if (errors.length) process.exit(1);
console.log(`OK: ${Object.keys(d.values).length} areas, +${Object.keys(d.more ?? {}).length} indicators, ` +
  `${Object.keys(sec.sectors).length} sectors, years ${d.years.join(', ')}, ${warnings.length} warning(s)`);
