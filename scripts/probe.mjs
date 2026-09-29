import { runProbe } from './lib/probe.mjs';

const dir = process.argv[2] || 'assets';
const report = runProbe(dir);
if (!report) process.exit(2);

const filter = process.argv[3];
let bad = 0;
console.log('=== DOM PROBE (headless Chromium parse + layout) ===');
for (const r of report) {
  if (filter && !r.file.includes(filter)) continue;
  const issues = [];
  if (r.parseError) issues.push('XML PARSE ERROR: ' + r.parseError);
  if (!r.anim) issues.push('no animations');
  if (r.overflow?.length) issues.push('text outside viewBox: ' + r.overflow.join(' | '));
  if (r.clipped) issues.push(`${r.clipped} shape(s) fully outside viewBox`);
  if (issues.length) bad++;
  console.log(
    (issues.length ? 'FAIL' : 'ok  ').padEnd(5) +
    r.file.padEnd(28) +
    `vb=${String(r.viewBox).padEnd(20)} anim=${String(r.anim).padStart(4)} shape=${String(r.shapes).padStart(4)} text=${String(r.texts).padStart(3)} defs=${String(r.defs).padStart(3)}` +
    (issues.length ? '\n      - ' + issues.join('\n      - ') : '')
  );
}
console.log(bad ? `\n${bad} file(s) with issues` : '\nall probe checks passed');
process.exit(bad ? 1 : 0);
