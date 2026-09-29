import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export function buildProbeHtml(dir = 'assets') {
  const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
  const payloads = files.map((f) => ({ file: f, src: readFileSync(join(dir, f), 'utf8') }));
  const html = `<!doctype html><html><body><pre id="out"></pre><script>
const DATA = ${JSON.stringify(payloads)};
const lines = [];
for (const { file, src } of DATA) {
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  const perr = doc.querySelector('parsererror');
  const svg = doc.documentElement;
  const res = { file, parseError: perr ? perr.textContent.replace(/\\s+/g, ' ').slice(0, 200) : null,
    viewBox: svg.getAttribute('viewBox'), w: svg.getAttribute('width'), h: svg.getAttribute('height'),
    anim: doc.querySelectorAll('animate, animateTransform, animateMotion').length,
    shapes: doc.querySelectorAll('path,circle,rect,ellipse,polygon,line').length,
    texts: doc.querySelectorAll('text').length,
    defs: doc.querySelectorAll('linearGradient,radialGradient,filter,mask,clipPath').length,
    overflow: [], clipped: 0 };
  const vb = (res.viewBox || '').split(/[ ,]+/).map(Number);
  if (vb.length === 4) {
    doc.querySelectorAll('text').forEach((t) => {
      if (t.closest('clipPath') || t.closest('mask')) return; // visually clipped, cannot overflow
      const cs = getComputedStyle(t);
      const fs = parseFloat(cs.fontSize) || parseFloat(t.getAttribute('font-size')) || 0;
      const ls = parseFloat(cs.letterSpacing) || 0;
      let approx = 0;
      for (const ch of (t.textContent || '')) approx += (ch === ' ' ? fs * 0.32 : fs * 0.6) + ls;
      const x = parseFloat(t.getAttribute('x') || 0);
      const anchor = cs.textAnchor && cs.textAnchor !== 'start' ? cs.textAnchor : t.getAttribute('text-anchor') || 'start';
      let left = anchor === 'middle' ? x - approx / 2 : anchor === 'end' ? x - approx : x;
      if (!t.querySelector('tspan[x]') && (left < -3 || left + approx > vb[2] + 3)) res.overflow.push((t.textContent || '').slice(0, 30) + ' [' + Math.round(left) + '..' + Math.round(left + approx) + '] w=' + vb[2]);
    });
    doc.querySelectorAll('path,circle,ellipse,rect').forEach((el) => {
      if (el.closest('mask') || el.closest('clipPath') || el.closest('defs')) return;
      try {
        const b = el.getBBox();
        if (b.x + b.width < -6 || b.x > vb[2] + 6 || b.y + b.height < -6 || b.y > vb[3] + 6) res.clipped++;
      } catch (e) {}
    });
  }
  lines.push(res);
}
document.getElementById('out').textContent = JSON.stringify(lines);
<\/script></body></html>`;
  mkdirSync('shots', { recursive: true });
  const tmp = resolve('shots', 'probe.html');
  writeFileSync(tmp, html);
  return { tmp, files };
}

export function runProbe(dir = 'assets') {
  const { tmp, files } = buildProbeHtml(dir);
  let dom = '';
  try {
    dom = execFileSync(
      EDGE,
      ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=20000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
      { encoding: 'utf8', maxBuffer: 1 << 28, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] }
    );
  } catch (e) {
    console.error('probe failed:', e.message);
    return null;
  }
  const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!m) { console.error('probe: no <pre> output (dom len ' + dom.length + ')'); return null; }
  const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  let report = [];
  try { report = JSON.parse(unesc(m[1])); } catch (e) { console.error('probe json fail:', e.message); return null; }
  void files;
  return report;
}
