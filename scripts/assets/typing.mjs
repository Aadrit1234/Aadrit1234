import { THEMES, FONT_MONO, svgDoc, gradient, glowFilter, r2, txt } from '../lib/core.mjs';

const W = 780;
const H = 76;

const LINES = [
  'Full-Stack Developer',
  'Offensive Security Researcher',
  'AI / ML Explorer',
  'Reverse Engineer at Heart',
  'Open Source Contributor',
];

// Each line owns a typewriter clip that grows during its own slice of the master cycle.
export function typing(themeId = 'dark') {
  const t = THEMES[themeId];
  const fs = 30;
  const cw = fs * 0.6;
  const maxChars = Math.max(...LINES.map((l) => l.length));
  const textW = r2(maxChars * cw + 12);
  const x0 = r2((W - textW) / 2 + 12);
  const y = 48;
  const cycle = 12;
  const total = cycle * LINES.length;

  const defs = [
    gradient('tgrad', [[0, t.glow], [0.5, t.glow2], [1, t.glow3]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    glowFilter('tglow', 4.5),
  ].join('\n');

  const body = `<g font-family="${FONT_MONO}" font-size="${fs}" font-weight="600">
${LINES.map((line, i) => {
    const begin = -(i * cycle);
    // keyTimes inside the master cycle: type 0.04->0.42, hold to 0.78, fade out by 0.96
    const vis = '0;0.04;0.78;0.96;1';
    const visVals = '0;1;1;0;0';
    const ty = '0.02;0.44;0.46;0.96;1';
    const wFull = r2(line.length * cw + 10);
    return `<clipPath id="tc${i}"><rect x="${r2(x0 - 10)}" y="8" width="0" height="${H - 20}"><animate attributeName="width" values="0;0;${wFull};${wFull};0" keyTimes="${ty}" dur="${total}s" begin="${begin}s" repeatCount="indefinite"/></rect></clipPath>
<g clip-path="url(#tc${i})" opacity="0">
<text x="${x0}" y="${y}" fill="url(#tgrad)">${txt(line)}</text>
<animate attributeName="opacity" values="${visVals}" keyTimes="${vis}" dur="${total}s" begin="${begin}s" repeatCount="indefinite"/>
</g>`;
  }).join('\n')}
</g>
<g>
<circle cx="${r2(x0 - 24)}" cy="${y - 7}" r="2.6" fill="${t.glow}"/>
<circle cx="${r2(x0 - 24)}" cy="${y + 3}" r="2.6" fill="${t.glow2}"/>
<circle cx="${r2(x0 - 24)}" cy="${y + 13}" r="2.6" fill="${t.glow3}"/>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur="1.6s" repeatCount="indefinite"/>
</g>
<g font-family="${FONT_MONO}" font-size="11.5" letter-spacing="4.5" fill="${t.faint}" text-anchor="middle">
<text x="${W / 2}" y="${H - 6}" opacity="0.75">STATUS: BUILDING THINGS</text>
</g>`;

  return svgDoc({ w: W, h: H, theme: t, title: 'Aadrit — rotating role titles', defs, body });
}
