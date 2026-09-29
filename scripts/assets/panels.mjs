import { THEMES, FONT_MONO, FONT_SANS, svgDoc, gradient, radial, glowFilter, blurFilter, starfield, r2, txt, hashCode, mulberry32 } from '../lib/core.mjs';
import { icosphere, makeCamera, rotX, rotY, matmul, apply } from '../lib/three.mjs';
import { renderEdges, renderFaces, morphNum } from '../lib/frames.mjs';

// ---------- flowing wave dividers ----------
export function waves(themeId = 'dark') {
  const t = THEMES[themeId];
  const W = 1200, H = 130;
  const rnd = mulberry32(5);

  function wave(color, yBase, amp, freq, dur, opacity, width = 2) {
    const steps = 60;
    const xs = Array.from({ length: steps + 1 }, (_, i) => (i / steps) * (W + 20) - 10);
    const pathFor = (phaseShift, ampMul) =>
      xs
        .map((x, i) => {
          const y = yBase + Math.sin((x / W) * Math.PI * 2 * freq + phaseShift) * amp * ampMul;
          return `${i === 0 ? 'M' : 'L'}${r2(x)} ${r2(y)}`;
        })
        .join('');
    const d0 = pathFor(0, 1);
    const d1 = pathFor(Math.PI * 0.75, 0.5);
    const d2 = pathFor(Math.PI * 1.6, 0.35);
    return `<path d="${d0}" stroke="${color}" stroke-width="${width}" fill="none" opacity="${opacity}" stroke-linecap="round">
<animate attributeName="d" values="${d0};${d1};${d2};${d0}" dur="${dur}s" repeatCount="indefinite"/>
</path>`;
  }

  const defs = [
    gradient('wfade', [[0, t.bg0, 0], [1, t.bg0, 0.9]], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    glowFilter('wglow', 3.2),
    blurFilter('wblur', 7),
  ].join('\n');

  const sparks = Array.from({ length: 14 }, (_, i) => {
    const x = r2(rnd() * W);
    const col = [t.glow, t.glow2, t.glow3][i % 3];
    return `<circle cx="${x}" cy="${r2(20 + rnd() * 40)}" r="${r2(1 + rnd() * 1.6)}" fill="${col}" opacity="0.8">
<animate attributeName="cy" values="${r2(20 + rnd() * 40)};${r2(-20)}" dur="${r2(3 + rnd() * 4)}s" begin="${r2(-rnd() * 6)}s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0;0.9;0" dur="${r2(3 + rnd() * 4)}s" begin="${r2(-rnd() * 6)}s" repeatCount="indefinite"/>
</circle>`;
  }).join('\n');

  const body = `<g opacity="0.9">
${wave(t.wave1, 70, 16, 2.1, 9, 0.75, 2.2)}
${wave(t.wave2, 82, 13, 3.0, 12, 0.6, 1.8)}
${wave(t.wave3, 62, 9, 1.5, 15, 0.45, 1.4)}
</g>
<rect y="${H - 46}" width="${W}" height="46" fill="url(#wfade)"/>
${sparks}`;

  return svgDoc({ w: W, h: H, theme: t, title: 'Animated wave divider', defs, body });
}

// ---------- commit pulse (real contribution data) ----------
export function pulse(themeId = 'dark', data = {}) {
  const t = THEMES[themeId];
  const cols = 26;
  const rows = 7;
  const cell = 17;
  const gap = 4;
  const padL = 46;
  const padT = 34;
  const W = padL + cols * (cell + gap) + 30;
  const H = padT + rows * (cell + gap) + 46;

  const contrib = new Map((data.contributions || []).map((c) => [c.date, c.count]));
  const total = (data.contributions || []).reduce((a, c) => a + c.count, 0);
  const activeDays = (data.contributions || []).filter((c) => c.count > 0).length;
  const best = (data.contributions || []).reduce((a, c) => Math.max(a, c.count), 0);

  // Build a Sunday-aligned grid ending today.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - (cols * 7 - 1));

  const maxCount = Math.max(4, best);
  const levelColor = (n) => {
    if (n === 0) return t.id === 'dark' ? '#131735' : '#e6eaf7';
    const lv = Math.min(4, Math.ceil((n / maxCount) * 4));
    const ramp = t.id === 'dark'
      ? ['#1b2a55', '#0e7490', '#22d3ee', '#a855f7', '#f472b6']
      : ['#dbe6f7', '#a5d8ea', '#0891b2', '#7c3aed', '#db2777'];
    return ramp[lv];
  };

  let cells = '';
  let monthLabels = '';
  let lastMonth = -1;
  for (let c = 0; c < cols; c++) {
    for (let rw = 0; rw < rows; rw++) {
      const d = new Date(start);
      d.setDate(start.getDate() + c * 7 + rw);
      if (d > today) continue;
      const iso = d.toISOString().slice(0, 10);
      const n = contrib.get(iso) || 0;
      const x = padL + c * (cell + gap);
      const y = padT + rw * (cell + gap);
      const col = levelColor(n);
      const tip = `${iso} · ${n} commit${n === 1 ? '' : 's'}`;
      cells += `<g>
<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="${col}"/>
${n > 0 ? `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="${t.ink}" opacity="0">
<animate attributeName="opacity" values="0;0.9;0" dur="1.6s" begin="${r2((c * 7 + rw) * 0.045)}s" repeatCount="indefinite"/>
</rect>` : ''}
<title>${txt(tip)}</title>
</g>`;
      if (rw === 0 && d.getMonth() !== lastMonth && c > 0) {
        lastMonth = d.getMonth();
        monthLabels += `<text x="${x}" y="${padT - 12}" font-family="${FONT_MONO}" font-size="10" fill="${t.faint}" opacity="0.8">${txt(d.toLocaleString('en-US', { month: 'short' }))}</text>`;
      }
    }
  }

  const dayLabels = ['Sun', 'Mon', 'Wed', 'Fri']
    .map((d, i) => `<text x="${padL - 10}" y="${padT + [0, 1, 3, 5][i] * (cell + gap) + cell - 4}" font-family="${FONT_MONO}" font-size="9.5" fill="${t.faint}" text-anchor="end" opacity="0.7">${d}</text>`)
    .join('\n');

  const legend = [0, 1, 2, 3, 4]
    .map((i) => {
      const n = i === 0 ? 0 : Math.round((maxCount / 4) * i);
      return `<rect x="${padL + 12 + i * 20}" y="${H - 30}" width="13" height="13" rx="3.5" fill="${levelColor(n)}"/>`;
    })
    .join('');

  const defs = [
    glowFilter('pglow', 3),
    gradient('pg', [[0, t.glow], [1, t.glow2]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
  ].join('\n');

  const body = `<g>${cells}</g>
${monthLabels}
${dayLabels}
${legend}
<text x="${padL + 12 + 5 * 20 + 8}" y="${H - 20}" font-family="${FONT_MONO}" font-size="9.5" fill="${t.faint}" opacity="0.7">more</text>
<g font-family="${FONT_MONO}">
<text x="${padL}" y="20" font-size="12" letter-spacing="2.4" fill="url(#pg)" font-weight="700">COMMIT PULSE</text>
<text x="${W - 26}" y="20" font-size="11" fill="${t.muted}" text-anchor="end">${total} commits · ${activeDays} active days</text>
</g>`;

  return svgDoc({ w: W, h: H, theme: t, title: 'Contribution pulse chart', defs, body });
}

// ---------- matrix rain ----------
export function matrix(themeId = 'dark') {
  const t = THEMES[themeId];
  const W = 1200, H = 200;
  const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾊﾋﾌﾍﾎ0123456789ABCDEF<>/\\[]{}$#@%&*';
  const colW = 22;
  const cols = Math.floor(W / colW);
  const rnd = mulberry32(1234);

  let out = '';
  for (let c = 0; c < cols; c++) {
    const speed = r2(2.4 + rnd() * 3.6);
    const delay = r2(-rnd() * 8);
    const headY = r2(-200 - rnd() * 200);
    const len = 6 + Math.floor(rnd() * 8);
    const chars = [];
    for (let k = 0; k < len; k++) {
      const g = glyphs[Math.floor(rnd() * glyphs.length)];
      const fade = 1 - k / len;
      chars.push(`<tspan x="${c * colW + 2}" dy="${k === 0 ? 0 : 20}" fill="${k === 0 ? t.head : t.tail}" opacity="${r2(0.15 + fade * 0.85)}">${txt(g)}</tspan>`);
    }
    out += `<g clip-path="url(#col${c})">
<text x="${c * colW}" y="${headY}" font-family="${FONT_MONO}" font-size="16" opacity="${r2(0.35 + rnd() * 0.5)}">
${chars.join('')}
<animateTransform attributeName="transform" type="translate" values="0 0;0 ${H + 260}" dur="${speed}s" begin="${delay}s" repeatCount="indefinite"/>
</text>
</g>`;
  }

  const defs = [
    gradient('mfade', [[0, t.bg0, 0.95], [0.35, t.bg0, 0.25], [1, t.bg0, 0.95]], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    glowFilter('mglow', 2.6),
    Array.from({ length: cols }, (_, c) => `<clipPath id="col${c}"><rect x="${c * colW}" y="-260" width="${colW - 3}" height="${H + 560}"/></clipPath>`).join('\n'),
  ].join('\n');

  const body = `${out}
<rect width="${W}" height="${H}" fill="url(#mfade)"/>
<rect x="0" y="0" width="${W}" height="1.5" fill="url(#mline)"/>
<linearGradient id="mline" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.glow}" stop-opacity="0"/><stop offset="0.5" stop-color="${t.glow}" stop-opacity="0.7"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></linearGradient>`;

  return svgDoc({ w: W, h: H, theme: t, title: 'Matrix rain divider', defs, body });
}

// ---------- glass stat card ----------
export function card(themeId = 'dark', data = {}) {
  const t = THEMES[themeId];
  const W = 900, H = 240;
  const stats = [
    { label: 'COMMITS', value: data.commits ?? '—', color: t.glow },
    { label: 'REPOS', value: data.publicRepos ?? '—', color: t.glow2 },
    { label: 'STARS', value: data.totalStars ?? '—', color: t.glow3 },
    { label: 'LANGS', value: (data.languages || []).length || '—', color: '#34d399' },
  ];
  const cw = (W - 48) / 4;

  const cards = stats
    .map((s, i) => {
      const x = 24 + i * cw;
      const y = 46;
      const h = 150;
      const digits = String(s.value).length;
      return `<g>
<rect x="${r2(x + 4)}" y="${y}" width="${r2(cw - 20)}" height="${h}" rx="16" fill="${t.panel}" stroke="${t.line}" stroke-width="1"/>
<rect x="${r2(x + 4)}" y="${y}" width="${r2(cw - 20)}" height="${h}" rx="16" fill="url(#cardG${i})" opacity="0.14"/>
<linearGradient id="cardG${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity="0.55"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>
<rect x="${r2(x + 4)}" y="${y}" width="${r2(cw - 20)}" height="3" rx="1.5" fill="${s.color}" opacity="0.85">
<animate attributeName="width" values="0;${r2(cw - 20)}" dur="1s" begin="${i * 0.15}s" fill="freeze"/>
</rect>
<g font-family="${FONT_SANS}">
<text x="${r2(x + 4 + (cw - 20) / 2)}" y="${y + 92}" font-size="46" font-weight="800" fill="${s.color}" text-anchor="middle" filter="url(#cglow)">${txt(String(s.value))}
<animate attributeName="opacity" values="0;1" dur="0.5s" begin="${0.6 + i * 0.15}s" fill="freeze"/>
</text>
<text x="${r2(x + 4 + (cw - 20) / 2)}" y="${y + 122}" font-family="${FONT_MONO}" font-size="11.5" letter-spacing="3.4" fill="${t.muted}" text-anchor="middle">${txt(s.label)}</text>
</g>
<circle cx="${r2(x + cw / 2 - 6)}" cy="${y + 26}" r="3" fill="${s.color}" opacity="0.9">
<animate attributeName="opacity" values="0.9;0.15;0.9" dur="${2 + i * 0.4}s" repeatCount="indefinite"/>
</circle>
</g>`;
      void digits;
    })
    .join('\n');

  const defs = [
    gradient('cbt', [[0, t.glow], [1, t.glow2]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    glowFilter('cglow', 4),
    radial('camb', [[0, t.glow2, 0.14], [1, t.glow2, 0]], { cx: 0.2, cy: 0.1, r: 0.7 }),
  ].join('\n');

  const body = `<text x="${W / 2}" y="26" font-family="${FONT_MONO}" font-size="12" letter-spacing="4" fill="url(#cbt)" text-anchor="middle" font-weight="700">TELEMETRY</text>
<rect width="${W}" height="${H}" fill="url(#camb)"/>
${cards}`;

  return svgDoc({ w: W, h: H, theme: t, title: 'Profile telemetry cards', defs, body });
}

// ---------- project card (one per repo) ----------
const LANG_HUE = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#a855f7',
  Python: '#4b8bbe', Makefile: '#6d8086', Dockerfile: '#2496ed', Shell: '#89e051',
};

function wrapText(s, max) {
  const words = String(s || '').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

export function projectCard(themeId = 'dark', repo = {}) {
  const t = THEMES[themeId];
  const W = 470, H = 268;
  const langs = (repo.langs || []).slice(0, 4);
  const total = (repo.langs || []).reduce((a, l) => a + l.size, 0) || 1;

  const desc = wrapText(repo.desc || 'Work in progress.', 58).slice(0, 4);
  const barW = W - 56;
  let x = 28;
  const bar = langs
    .map((l) => {
      const w = (l.size / total) * barW;
      const seg = `<rect x="${r2(x)}" y="${H - 62}" width="${r2(w)}" height="7" rx="3.5" fill="${LANG_HUE[l.name] || t.glow}">
<animate attributeName="width" values="0;${r2(w)}" dur="0.9s" begin="0.35s" fill="freeze"/>
</rect>`;
      x += w;
      return seg;
    })
    .join('\n');

  const legend = langs
    .map((l, i) => {
      const lx = 28 + i * ((W - 56) / langs.length);
      return `<circle cx="${r2(lx + 4)}" cy="${H - 40}" r="3.6" fill="${LANG_HUE[l.name] || t.glow}"/>
<text x="${r2(lx + 13)}" y="${H - 36}" font-family="${FONT_MONO}" font-size="10.5" fill="${t.muted}">${txt(l.name)}</text>`;
    })
    .join('\n');

  const stars = repo.stars || 0;
  const chips = [];
  if (stars) chips.push({ t: `\u2605 ${stars}`, c: '#f0b429' });
  if (repo.demo) chips.push({ t: 'LIVE DEMO', c: t.glow2 });
  let cx = W - 28;
  const chipSvg = chips
    .map((ch) => {
      const w = ch.t.length * 6.4 + 18;
      cx -= w;
      const out = `<g>
<rect x="${r2(cx)}" y="26" width="${r2(w)}" height="20" rx="10" fill="${ch.c}" opacity="0.14" stroke="${ch.c}" stroke-opacity="0.5"/>
<text x="${r2(cx + w / 2)}" y="40" font-family="${FONT_MONO}" font-size="9.5" letter-spacing="1" fill="${ch.c}" text-anchor="middle">${txt(ch.t)}</text>
</g>`;
      cx -= 6;
      return out;
    })
    .reverse()
    .join('\n');

  const accent = [t.glow, t.glow2, t.glow3, '#34d399'][Math.abs(hashCode(repo.name || '')) % 4];

  const defs = [
    gradient('pgt', [[0, accent, 0.16], [1, accent, 0]], { x1: 0, y1: 0, x2: 1, y2: 1 }),
    glowFilter('pglow', 2.4),
  ].join('\n');

  const body = `<g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="${t.panel}" stroke="${t.line}" stroke-width="1"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="url(#pgt)"/>
<rect x="28" y="0" width="3" height="${H}" fill="${accent}" opacity="0.9">
<animate attributeName="opacity" values="0.35;1;0.35" dur="4s" repeatCount="indefinite"/>
</rect>
${chipSvg}
<g font-family="${FONT_MONO}">
<text x="28" y="42" font-size="17" font-weight="700" fill="${t.text}">${txt(repo.name || '')}</text>
</g>
<g font-family="${FONT_SANS}">
${desc
  .map(
    (l, i) =>
      `<text x="28" y="${76 + i * 19}" font-size="12.5" fill="${i === 0 ? t.muted : t.dim}">${txt(l)}
<animate attributeName="opacity" values="0;1" dur="0.5s" begin="${0.2 + i * 0.12}s" fill="freeze"/></text>`,
  )
  .join('\n')}
</g>
${bar}
${legend}
</g>`;

  return svgDoc({ w: W, h: H, theme: t, title: `${repo.name} card`, defs, body });
}

void FONT_SANS;
