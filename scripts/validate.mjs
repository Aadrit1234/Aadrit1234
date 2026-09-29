import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const dir = process.argv[2] || 'assets';
const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();

function staticChecks(src) {
  const problems = [];
  if (/NaN|undefined|Infinity/.test(src)) problems.push('contains NaN/undefined/Infinity');
  if ((src.match(/<svg[\s>]/g) || []).length !== 1) problems.push('svg root count != 1');
  if (!/viewBox=/.test(src)) problems.push('missing viewBox');
  for (const m of src.matchAll(/(?:href|url)\(#([^)"']+)\)/g)) {
    if (!new RegExp(`id="${m[1]}"`).test(src)) problems.push(`dangling reference #${m[1]}`);
  }
  for (const m of src.matchAll(/values="([^"]+)"\s+keyTimes="([^"]+)"/g)) {
    if (m[1].split(';').length !== m[2].split(';').length) problems.push(`values/keyTimes mismatch (${m[1].split(';').length} vs ${m[2].split(';').length})`);
  }
  for (const m of src.matchAll(/values="([^"]+)"[^>]*calcMode="spline"[^>]*keySplines="([^"]+)"/g)) {
    const v = m[1].split(';').length, s = m[2].split(';').length;
    if (s !== v - 1) problems.push(`keySplines(${s}) != values-1(${v - 1})`);
  }
  for (const m of src.matchAll(/<(animate|animateTransform|animateMotion)\b[^>]*>/g)) {
    if (!/dur="[^"]+"/.test(m[0])) problems.push(`${m[1]} missing dur`);
  }
  // gradients must reference defined stops and have >=2 stops
  for (const m of src.matchAll(/<(linear|radial)Gradient\b[^>]*>([\s\S]*?)<\/\1Gradient>/g)) {
    if ((m[2].match(/<stop/g) || []).length < 2) problems.push(`gradient ${m[0].slice(0, 60)} has <2 stops`);
  }
  // filters need a result-consuming primitive
  for (const m of src.matchAll(/<filter\b[^>]*>([\s\S]*?)<\/filter>/g)) {
    if (!/fe[A-Z]/.test(m[1])) problems.push('filter with no fe* primitive');
  }
  // unbalanced tags (open = <tag followed by whitespace, >, or /)
  for (const tag of ['g', 'defs', 'text', 'svg', 'mask', 'clipPath']) {
    const openRe = new RegExp('<' + tag + '(?=[\\s>/])', 'g');
    const closeRe = new RegExp('</' + tag + '\\s*>', 'g');
    const o = (src.match(openRe) || []).length;
    const c = (src.match(closeRe) || []).length;
    if (o !== c) problems.push(`<${tag}> ${o} open vs ${c} close`);
  }
  // animating non-animatable / typo'd attributes
  for (const m of src.matchAll(/<animate\b[^>]*attributeName="([^"]+)"/g)) {
    if (!/^(d|x|y|x1|y1|x2|y2|cx|cy|r|rx|ry|width|height|opacity|fill-opacity|stroke-opacity|stroke-width|offset|stop-color|transform|points|visibility|fill|stroke|font-size)$/.test(m[1])) {
      problems.push(`suspicious animate attributeName="${m[1]}"`);
    }
  }
  return [...new Set(problems)];
}

const payloads = files.map((f) => ({ file: f, src: readFileSync(join(dir, f), 'utf8') }));

const html = `<!doctype html><html><body><pre id="out"></pre><script>
const DATA = ${JSON.stringify(payloads)};
const lines = [];
for (const { file, src } of DATA) {
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  const perr = doc.querySelector('parsererror');
  const svg = doc.documentElement;
  const res = { file, parseError: perr ? perr.textContent.replace(/\\s+/g,' ').slice(0,180) : null,
    viewBox: svg.getAttribute('viewBox'), w: svg.getAttribute('width'), h: svg.getAttribute('height'),
    anim: doc.querySelectorAll('animate, animateTransform, animateMotion').length,
    shapes: doc.querySelectorAll('path,circle,rect,ellipse,polygon,line').length,
    texts: doc.querySelectorAll('text').length,
    defs: doc.querySelectorAll('linearGradient,radialGradient,filter,mask,clipPath').length,
    overflow: [] };
  const vb = (res.viewBox||'').split(/[ ,]+/).map(Number);
  if (vb.length === 4) {
    doc.querySelectorAll('text').forEach((t) => {
      const cs = getComputedStyle(t);
      const fs = parseFloat(cs.fontSize) || parseFloat(t.getAttribute('font-size')) || 0;
      const ls = parseFloat(cs.letterSpacing) || 0;
      const s = t.textContent || '';
      let approx = 0;
      for (const ch of s) approx += (ch === ' ' ? fs*0.32 : fs*0.6) + ls;
      const x = parseFloat(t.getAttribute('x') || 0);
      const anchor = cs.textAnchor || t.getAttribute('text-anchor') || 'start';
      let left = x;
      if (anchor === 'middle') left = x - approx/2;
      else if (anchor === 'end') left = x - approx;
      if (left < -3 || left + approx > vb[2] + 3) res.overflow.push(s.slice(0,34)+' ['+Math.round(left)+'..'+Math.round(left+approx)+'] w='+vb[2]);
    });
    // shapes escaping viewbox (clipped content is invisible -> looks broken)
    let clipped = 0;
    doc.querySelectorAll('path,circle,ellipse,rect').forEach((el) => {
      if (el.closest('mask') || el.closest('clipPath') || el.closest('defs')) return;
      try {
        const b = el.getBBox();
        const fullyOutside = b.x + b.width < -6 || b.x > vb[2] + 6 || b.y + b.height < -6 || b.y > vb[3] + 6;
        if (fullyOutside) clipped++;
      } catch (e) {}
    });
    res.fullyClipped = clipped;
  }
  lines.push(res);
}
document.getElementById('out').textContent = JSON.stringify(lines);
<\/script></body></html>`;

mkdirSync('shots', { recursive: true });
const tmp = join('shots', 'probe.html');
writeFileSync(tmp, html);

let dom = '';
try {
  dom = execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=15000', '--dump-dom', `file:///${tmp.replace(/\\/g, '/')}`], { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', maxBuffer: 1 << 28, timeout: 120000 });
} catch (e) {
  console.error('probe failed:', e.message);
}

console.log('=== STATIC CHECKS ===');
const staticFail = [];
for (const p of payloads) {
  const probs = staticChecks(p.src);
  if (probs.length) staticFail.push(p.file);
  console.log(`${probs.length ? 'FAIL' : 'ok'}`.padEnd(5) + `${p.file.padEnd(26)} ${(p.src.length / 1024).toFixed(1).padStart(7)} KB` + (probs.length ? '\n      - ' + probs.join('\n      - ') : ''));
}

const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!m) {
  console.log('\n=== DOM PROBE === no output');
  process.exit(staticFail.length ? 1 : 0);
}
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
let report = [];
try { report = JSON.parse(unesc(m[1])); } catch (e) { console.log('probe parse fail', e.message); }
console.log('\n=== DOM PROBE (real browser parse + layout) ===');
for (const r of report) {
  const bad = [];
  if (r.parseError) bad.push('XML PARSE ERROR: ' + r.parseError);
  if (!r.anim) bad.push('no animations');
  if (r.overflow && r.overflow.length) bad.push('text outside viewBox: ' + r.overflow.join(' | '));
  if (r.fullyClipped) bad.push(`${r.fullyClipped} shape(s) fully outside viewBox`);
  console.log(`${bad.length ? 'FAIL' : 'ok'}`.padEnd(5) + `${r.file.padEnd(26)} vb=${String(r.viewBox).padEnd(20)} anim=${String(r.anim).padStart(4)} shape=${String(r.shapes).padStart(4)} text=${String(r.texts).padStart(3)} defs=${String(r.defs).padStart(3)}` + (bad.length ? '\n      - ' + bad.join('\n      - ') : ''));
  if (bad.length) staticFail.push(r.file);
}
console.log(`\n${staticFail.length ? 'FAILED: ' + staticFail.join(', ') : 'ALL CHECKS PASSED'}`);
process.exit(staticFail.length ? 1 : 0);
