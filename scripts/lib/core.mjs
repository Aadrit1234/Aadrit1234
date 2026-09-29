export const THEMES = {
  dark: {
    id: 'dark',
    bg0: '#05060f',
    bg1: '#0a0d1f',
    panel: '#0b0e20',
    panel2: '#121732',
    line: '#232b56',
    ink: '#e9ecff',
    muted: '#9aa2d8',
    faint: '#4d558c',
    glow: '#22d3ee',
    glow2: '#a855f7',
    glow3: '#f472b6',
    grid: '#2b3378',
    star: '#e4eaff',
    wave1: '#22d3ee',
    wave2: '#a855f7',
    wave3: '#f472b6',
    head: '#b8fff4',
    tail: '#123a55',
  },
  light: {
    id: 'light',
    bg0: '#ffffff',
    bg1: '#f4f6fd',
    panel: '#ffffff',
    panel2: '#eef1fb',
    line: '#c9d0ee',
    ink: '#101533',
    muted: '#4a5382',
    faint: '#8e97c0',
    glow: '#0891b2',
    glow2: '#7c3aed',
    glow3: '#db2777',
    grid: '#b6c0ea',
    star: '#3a4270',
    wave1: '#0891b2',
    wave2: '#7c3aed',
    wave3: '#db2777',
    head: '#0e7490',
    tail: '#cfe9f2',
  },
};

// NOTE: font stacks use single quotes so they stay valid inside double-quoted XML attributes.
export const FONT_MONO =
  "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono','Courier New',monospace";
export const FONT_SANS =
  "system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

// Escape a string for use inside a double-quoted XML attribute value.
export const attr = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Escape text content (& < > only).
export const txt = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const r2 = (n) => Math.round(n * 100) / 100;

// Truncate to a max length, breaking on a word boundary when possible.
export function clip(s, max) {
  const str = String(s || '').trim();
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-–—]+$/, '') + '…';
}

export function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
export const r3 = (n) => Math.round(n * 1000) / 1000;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function svgDoc({ w, h, theme, title, defs = '', body, style = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-label="${attr(title)}">
<title>${txt(title)}</title>
<defs>
${defs}
</defs>
${style ? `<style>\n${style}\n</style>` : ''}
${body}
</svg>
`;
}

export function gradient(id, stops, { x1 = 0, y1 = 0, x2 = 1, y2 = 0, units } = {}) {
  const u = units ? ` gradientUnits="${units}"` : '';
  const s = stops
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`)
    .join('');
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${u}>${s}</linearGradient>`;
}

export function radial(id, stops, { cx = 0.5, cy = 0.5, r = 0.5, units } = {}) {
  const u = units ? ` gradientUnits="${units}"` : '';
  const s = stops
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`)
    .join('');
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${u}>${s}</radialGradient>`;
}

export function glowFilter(id, std = 6, { merge = true } = {}) {
  return `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%">
<feGaussianBlur stdDeviation="${std}" result="b"/>
${merge ? `<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>` : ''}
</filter>`;
}

export function blurFilter(id, std) {
  return `<filter id="${id}" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="${std}"/></filter>`;
}

export function noiseFilter(id, freq = 0.8, oct = 3, seed = 7) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" result="n"/>
<feColorMatrix in="n" type="saturate" values="0"/>
</filter>`;
}

export function edgeFadeMask(id, w, h, { top = 0, bottom = 0, left = 0, right = 0 } = {}) {
  const parts = [];
  if (top > 0) {
    parts.push(
      `<linearGradient id="${id}_gt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>`,
      `<rect x="0" y="0" width="${w}" height="${top}" fill="url(#${id}_gt)"/>`
    );
  }
  if (bottom > 0) {
    parts.push(
      `<linearGradient id="${id}_gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
      `<rect x="0" y="${h - bottom}" width="${w}" height="${bottom}" fill="url(#${id}_gb)"/>`
    );
  }
  if (left > 0) {
    parts.push(
      `<linearGradient id="${id}_gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>`,
      `<rect x="0" y="0" width="${left}" height="${h}" fill="url(#${id}_gl)"/>`
    );
  }
  if (right > 0) {
    parts.push(
      `<linearGradient id="${id}_gr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
      `<rect x="${w - right}" y="0" width="${right}" height="${h}" fill="url(#${id}_gr)"/>`
    );
  }
  return { mask: `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h}" fill="#fff"/>${parts.join('')}</mask>`, defs: parts.filter((p) => p.includes('Gradient')).join('') };
}

export function starfield(w, h, count, t, seed = 11, { maxR = 1.9, dur = 3.4 } = {}) {
  const rnd = mulberry32(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = r2(rnd() * w);
    const y = r2(rnd() * h);
    const r = r2(0.35 + rnd() * maxR);
    const op = r2(0.25 + rnd() * 0.7);
    const b = r2(-rnd() * dur);
    const sp = r2(0.9 + rnd() * 2.4);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${t.star}" opacity="${op}"><animate attributeName="opacity" values="${op};${r2(op * 0.15)};${op}" dur="${sp}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="r" values="${r};${r2(r * 1.35)};${r}" dur="${sp}s" begin="${b}s" repeatCount="indefinite"/></circle>`;
  }
  return out;
}

export function auroraBlobs(w, h, t, seed = 23) {
  const rnd = mulberry32(seed);
  const cols = [t.glow, t.glow2, t.glow3, t.glow, t.glow2];
  let out = '';
  for (let i = 0; i < 5; i++) {
    const cx = r2(w * (0.12 + rnd() * 0.76));
    const cy = r2(h * (0.15 + rnd() * 0.7));
    const rx = r2(w * (0.16 + rnd() * 0.22));
    const ry = r2(h * (0.18 + rnd() * 0.3));
    const dur = r2(16 + rnd() * 18);
    const b = r2(-rnd() * dur);
    const op = r2(0.2 + rnd() * 0.3);
    const dx1 = r2((rnd() - 0.5) * w * 0.22);
    const dy1 = r2((rnd() - 0.5) * h * 0.3);
    const dx2 = r2((rnd() - 0.5) * w * 0.26);
    const dy2 = r2((rnd() - 0.5) * h * 0.34);
    out += `<g opacity="${op}" filter="url(#bigBlur)">
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#aur${i})"/>
<animateTransform attributeName="transform" type="translate" values="0 0;${dx1} ${dy1};${dx2} ${dy2};0 0" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/>
<animateTransform attributeName="transform" type="scale" additive="sum" values="1 1;1.14 0.9;0.92 1.16;1 1" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/>
</g>
<radialGradient id="aur${i}"><stop offset="0" stop-color="${cols[i % cols.length]}" stop-opacity="0.95"/><stop offset="0.55" stop-color="${cols[i % cols.length]}" stop-opacity="0.35"/><stop offset="1" stop-color="${cols[i % cols.length]}" stop-opacity="0"/></radialGradient>`;
  }
  return out;
}

export function auroraDefs(t) {
  return blurFilter('bigBlur', 58);
}

export function gridFloor(w, h, t, { horizon = 0.62, rows = 22, cols = 26, dur = 7 } = {}) {
  const hy = h * horizon;
  let out = `<rect x="0" y="${r2(hy)}" width="${w}" height="${r2(h - hy)}" fill="url(#floorFade)"/>
<linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg0}" stop-opacity="0.2"/><stop offset="1" stop-color="${t.bg0}" stop-opacity="0.95"/></linearGradient>`;
  let paths = '';
  for (let i = 0; i < rows; i++) {
    const p = i / (rows - 1);
    const y = hy + Math.pow(p, 2.35) * (h - hy);
    const o = r2(0.08 + p * 0.5);
    paths += `M0 ${r2(y)} H${w}`;
    void o;
    out += `<path d="M0 ${r2(y)} H${w}" stroke="${t.grid}" stroke-width="1" opacity="${o}"/>`;
  }
  for (let i = 0; i <= cols; i++) {
    const p = i / cols - 0.5;
    out += `<path d="M${r2(w / 2 + p * w * 0.06)} ${r2(hy)} L${r2(w / 2 + p * w * 2.6)} ${h}" stroke="${t.grid}" stroke-width="1" opacity="0.3"/>`;
  }
  out += `<g opacity="0.5"><animateTransform attributeName="transform" type="translate" values="0 0;0 ${r2((h - hy) / rows)}" dur="${dur}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" additive="sum" values="0 ${r2(-(h - hy) / rows)};0 0" dur="${dur}s" repeatCount="indefinite"/>${(() => {
    let inner = '';
    for (let i = 0; i < rows; i++) {
      const p = i / (rows - 1);
      const y = hy + Math.pow(p, 2.35) * (h - hy);
      inner += `<path d="M0 ${r2(y)} H${w}" stroke="${t.glow}" stroke-width="1" opacity="${r2(0.05 + p * 0.28)}"/>`;
    }
    return inner;
  })()}</g>`;
  void paths;
  return out;
}

export function scanSweep(w, h, t, { dur = 6.5, width = 0.16, y0 = 0, y1 = 1 } = {}) {
  return `<g opacity="0.9">
<rect x="${r2(-w * width)}" y="${r2(h * y0)}" width="${r2(w * width)}" height="${r2(h * (y1 - y0))}" fill="url(#sweepGrad)"/>
<animateTransform attributeName="transform" type="translate" values="0 0;${w * 1.2} 0" dur="${dur}s" repeatCount="indefinite"/>
</g>
<linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="${t.glow}" stop-opacity="0"/>
<stop offset="0.5" stop-color="${t.glow}" stop-opacity="0.16"/>
<stop offset="1" stop-color="${t.glow}" stop-opacity="0"/>
</linearGradient>`;
}

export function polylinePath(pts, close = false) {
  if (!pts.length) return '';
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += `L${r2(pts[i][0])} ${r2(pts[i][1])}`;
  return close ? d + 'Z' : d;
}

export function wavePath(w, h, amp, freq, phase, yBase) {
  let d = `M0 ${r2(yBase)}`;
  const step = 6;
  for (let x = 0; x <= w; x += step) {
    const y = yBase + Math.sin((x / w) * Math.PI * 2 * freq + phase) * amp;
    d += `L${x} ${r2(y)}`;
  }
  d += `L${w} ${h}L0 ${h}Z`;
  return d;
}

export function valuesList(arr, f = r2) {
  return arr.map(f).join(';');
}
