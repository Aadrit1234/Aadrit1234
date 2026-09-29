import { THEMES, FONT_MONO, svgDoc, gradient, glowFilter, r2, txt, clamp } from '../lib/core.mjs';

const W = 900;
const H = 520;

const SCRIPT = [
  { t: 'cmd', s: 'whoami' },
  { t: 'out', s: 'aadrit — full-stack / security / ai-ml' },
  { t: 'cmd', s: 'ls ./repos' },
  { t: 'out', s: 'conduit  printbridge  filemorph  FormulaVault  prompt-forge' },
  { t: 'cmd', s: 'cat stack.txt' },
  { t: 'out', s: 'TypeScript · Node · Fastify · Postgres · React · Three.js' },
  { t: 'out', s: 'Burp · Nmap · Ghidra · PyTorch · LLM agents' },
  { t: 'cmd', s: 'nmap --scan-me' },
  { t: 'out', s: 'open ports: 22 80 443 8080' },
  { t: 'out', s: 'vulnerabilities: too many to list' },
  { t: 'cmd', s: 'git push origin main' },
  { t: 'ok', s: 'shipped ✓' },
];

export function terminal(themeId = 'dark') {
  const t = THEMES[themeId];
  const padX = 26;
  const barH = 40;
  const fs = 14.5;
  const lh = 25;
  const cw = fs * 0.6;
  const x0 = padX + 26;
  const maxChars = Math.max(...SCRIPT.map((l) => l.s.length));
  const bodyW = maxChars * cw + 60;
  const Wd = Math.max(W, Math.ceil(bodyW + padX * 2));
  const Hd = Math.ceil(barH + 30 + SCRIPT.length * lh + 34);

  const COLORS = {
    cmd: t.glow,
    out: t.muted,
    ok: '#34d399',
  };

  // Master timeline: each line reveals char-by-char, then a caret blinks on the newest line.
  const perLine = 1.5;
  const total = SCRIPT.length * perLine + 2.4;

  const defs = [
    gradient('tbar', [[0, t.panel2], [1, t.panel]], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    gradient('tprompt', [[0, t.glow], [1, t.glow2]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    glowFilter('tglow2', 3),
    blurFilterSoft(t),
    `<linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.glow}" stop-opacity="0.06"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></linearGradient>`,
  ].join('\n');

  const lines = SCRIPT.map((l, i) => {
    const y = barH + 34 + i * lh;
    const w = r2(l.s.length * cw + 2);
    const begin = r2(i * perLine);
    const col = COLORS[l.t];
    const prompt = l.t === 'cmd' ? `<text x="${padX}" y="${y}" fill="url(#tprompt)" font-weight="700">❯</text>` : '';
    const indent = l.t === 'cmd' ? 0 : 14;
    return `<g>
<clipPath id="ln${i}"><rect x="${r2(x0 - 4)}" y="${r2(y - fs - 4)}" width="0" height="${lh}">
<animate attributeName="width" values="0;0;${w};${w}" keyTimes="0;0.001;0.55;1" calcMode="linear" dur="${r2(perLine)}s" begin="${begin}s" repeatCount="indefinite"/>
</rect></clipPath>
<g clip-path="url(#ln${i})" opacity="0">
${prompt}
<text x="${r2(x0 + indent)}" y="${y}" fill="${col}"${l.t === 'ok' ? ' font-weight="700"' : ''}>${txt(l.s)}</text>
<animate attributeName="opacity" values="0;1" keyTimes="0;0.12" dur="${r2(perLine)}s" begin="${begin}s" repeatCount="indefinite"/>
</g>
</g>`;
  }).join('\n');

  const lastY = barH + 34 + SCRIPT.length * lh - lh + 16;
  const body = `<rect width="${Wd}" height="${Hd}" rx="18" fill="${t.panel}"/>
<rect width="${Wd}" height="${barH}" rx="18" fill="url(#tbar)"/>
<rect y="${barH - 18}" width="${Wd}" height="18" fill="url(#tbar)"/>
<rect y="${barH - 1}" width="${Wd}" height="1" fill="${t.line}"/>
${[['#ff5f57', 18], ['#febc2e', 36], ['#28c840', 54]].map(([c, x]) => `<circle cx="${x}" cy="${barH / 2}" r="5.5" fill="${c}"/>`).join('\n')}
<g font-family="${FONT_MONO}" font-size="12" fill="${t.faint}" letter-spacing="1.5">
<text x="${Wd / 2}" y="${barH / 2 + 4}" text-anchor="middle">aadrit@dev — ~/profile</text>
</g>
<g>
<rect x="${Wd / 2 - 44}" y="${barH / 2 - 8}" width="88" height="16" rx="8" fill="${t.bg0}" opacity="0.55"/>
<text x="${Wd / 2}" y="${barH / 2 + 3.5}" font-family="${FONT_MONO}" font-size="9.5" letter-spacing="1.4" fill="${t.glow}" text-anchor="middle" opacity="0.9">LIVE TTY</text>
<rect x="${Wd / 2 - 44}" y="${barH / 2 - 8}" width="88" height="16" rx="8" fill="none" stroke="${t.glow}" stroke-width="1" opacity="0.5">
<animate attributeName="stroke-opacity" values="0.6;0.12;0.6" dur="2.2s" repeatCount="indefinite"/>
</rect>
</g>
<g font-family="${FONT_MONO}" font-size="${fs}">
${lines}
</g>
<g>
<rect x="${padX}" y="${r2(lastY - fs - 3)}" width="8" height="${fs + 4}" fill="${t.glow}" filter="url(#tglow2)" opacity="0.9">
<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.42;0.5;0.92;1" dur="1.05s" repeatCount="indefinite"/>
</rect>
</g>
<rect x="0" y="${barH}" width="${Wd}" height="${r2(Hd - barH)}" fill="url(#scan)" opacity="0.5"/>
<rect x="0" y="0" width="${Wd}" height="${Hd}" rx="18" fill="none" stroke="${t.line}" stroke-width="1.2"/>
<rect x="0" y="0" width="${Wd}" height="${Hd}" rx="18" fill="none" stroke="${t.glow}" stroke-width="1" opacity="0.18">
<animate attributeName="stroke-opacity" values="0.28;0.05;0.28" dur="5s" repeatCount="indefinite"/>
</rect>`;

  void clamp;
  return svgDoc({ w: Wd, h: Hd, theme: t, title: 'Animated terminal — Aadrit stack and skills', defs, body });
}

function blurFilterSoft(t) {
  void t;
  return `<filter id="tsoft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10"/></filter>`;
}
