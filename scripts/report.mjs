import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const dom = execFileSync(
  EDGE,
  ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=15000', '--dump-dom', 'file:///' + resolve('shots/probe.html').replace(/\\/g, '/')],
  { encoding: 'utf8', maxBuffer: 1 << 28, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] }
);
const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!m) { console.log('no probe output'); process.exit(1); }
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const r = JSON.parse(unesc(m[1]));
for (const x of r) {
  console.log(
    x.file.padEnd(26),
    '| parseError:', x.parseError ? x.parseError.slice(0, 100) : 'none',
    '| vb:', String(x.viewBox).padEnd(18),
    '| anim:', String(x.anim).padStart(4),
    '| text:', String(x.texts).padStart(3),
    '| overflow:', x.overflow && x.overflow.length ? JSON.stringify(x.overflow) : 'none'
  );
}
