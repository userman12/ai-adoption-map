// Checks data/ai-adoption.json. Exits 1 on any error; warnings don't fail.
// Usage: node scripts/validate-data.mjs
import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync(new URL('../data/ai-adoption.json', import.meta.url), 'utf8'));
const errors = [], warnings = [];

// 1. every value is a number in [0, 100]
for (const [geo, bySize] of Object.entries(d.values))
  for (const [size, byYear] of Object.entries(bySize))
    for (const [year, v] of Object.entries(byYear))
      if (typeof v !== 'number' || !(v >= 0 && v <= 100)) errors.push(`${geo} ${size} ${year}: ${v} is not a number in 0-100`);

// 2. EU27 "all" exists for every year
for (const y of d.years)
  if (d.values.EU27?.all?.[y] == null) errors.push(`EU27 all ${y}: missing`);

// 3. large >= small (warning only)
for (const [geo, s] of Object.entries(d.values))
  for (const y of d.years)
    if (s.small?.[y] != null && s.large?.[y] != null && s.large[y] < s.small[y])
      warnings.push(`${geo} ${y}: large ${s.large[y]} < small ${s.small[y]}`);

// 4-5. spot checks against Eurostat's published 2025 figures (±0.5 pp), always on 2025
const SPOT = [
  ['EU27', 'all', 20.0], ['DK', 'all', 42.0], ['FI', 'all', 37.8], ['RO', 'all', 5.2],
  ['EU27', 'small', 17.0], ['EU27', 'medium', 30.4], ['EU27', 'large', 55.0],
];
for (const [geo, size, want] of SPOT) {
  const got = d.values[geo]?.[size]?.[2025];
  if (got == null || Math.abs(got - want) > 0.5)
    errors.push(`spot check ${geo} ${size} 2025: expected ~${want}, found ${got ?? 'missing'} (codes: ${JSON.stringify(d.codes)})`);
}

for (const w of warnings) console.warn('WARN ', w);
for (const e of errors) console.error('ERROR', e);
if (errors.length) process.exit(1);
console.log(`OK: ${Object.keys(d.values).length} areas, years ${d.years.join(', ')}, ${warnings.length} warning(s)`);
