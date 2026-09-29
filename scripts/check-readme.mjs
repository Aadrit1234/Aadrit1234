// One-off: validate README structure and that every referenced asset exists.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const md = readFileSync('README.md', 'utf8');
const problems = [];
const seen = new Set();
// Prose mentions of tags inside backticks are not real HTML.
const body = md.replace(/`[^`\n]*`/g, '');

const refs = [
  ...[...md.matchAll(/(?:src|srcset)="\.\/([^"]+)"/g)].map((m) => m[1]),
];

for (const r of refs) {
  if (seen.has(r)) continue;
  seen.add(r);
  if (!existsSync(r)) problems.push(`missing asset: ${r}`);
}

const html = [...body.matchAll(/<\/?(div|table|tr|td|picture|source|img|a|br)\b[^>]*>/g)].map((m) => m[0]);

// Balance check for block tags that GitHub's HTML parser cares about.
for (const tag of ['picture', 'table', 'tr', 'td', 'a', 'div']) {
  const open = [...body.matchAll(new RegExp(`<${tag}(?=[\\s>])`, 'g'))].length;
  const close = [...body.matchAll(new RegExp(`</${tag}>`, 'g'))].length;
  if (open !== close) problems.push(`unbalanced <${tag}>: ${open} open vs ${close} close`);
}

// Column count must be consistent per table.
const tables = [...body.matchAll(/<table>([\s\S]*?)<\/table>/g)];
for (const [ti, t] of tables.entries()) {
  const rows = [...t[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  // A row may span the full table width if its single cell declares width="100%".
  const rowInfo = rows.map((r) => {
    const cells = [...r[1].matchAll(/<td([^>]*)>/g)].map((c) => c[1]);
    const spans = cells.reduce((a, attrs) => {
      const m = attrs.match(/width="(\d+)%"/);
      return a + (m ? Number(m[1]) : 100 / Math.max(cells.length, 1));
    }, 0);
    return { n: cells.length, spans };
  });
  for (const [ri, r] of rowInfo.entries()) {
    if (r.n < 1) problems.push(`table ${ti + 1} row ${ri + 1}: no cells`);
    if (Math.abs(r.spans - 100) > 1) problems.push(`table ${ti + 1} row ${ri + 1}: widths sum to ${r.spans}% (expected 100%)`);
  }
}

// picture requires at least one source when it has a light/dark switch.
for (const p of [...body.matchAll(/<picture>([\s\S]*?)<\/picture>/g)]) {
  if (!/source/.test(p[1])) problems.push('picture without <source>');
  if (!/<img/.test(p[1])) problems.push('picture without <img> fallback');
}

console.log(`asset refs: ${seen.size} (all exist unless listed below)`);
const rowTotal = [...body.matchAll(/<tr>/g)].length;
console.log(`html tags: ${html.length}  table rows: ${rowTotal}  tables: ${tables.length}`);
console.log(`size: ${(md.length / 1024).toFixed(1)} KB, ${md.split('\n').length} lines`);
if (problems.length) {
  console.log('\nPROBLEMS:');
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
console.log('\nREADME checks passed');
