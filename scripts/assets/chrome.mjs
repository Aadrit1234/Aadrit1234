import { THEMES, FONT_MONO, FONT_SANS, svgDoc, gradient, radial, glowFilter, blurFilter, starfield, r2, txt, clip, mulberry32 } from '../lib/core.mjs';
import { icosphere, cubeVerts, CUBE_EDGES, makeCamera, rotX, rotY, rotZ, matmul, apply } from '../lib/three.mjs';
import { renderEdges, renderPoints } from '../lib/frames.mjs';

// ---------- animated logo mark ----------
export function mark(themeId = 'dark') {
  const t = THEMES[themeId];
  const S = 120;
  const cam = makeCamera({ dist: 5.4, fov: 3.2 });
  const outer = cubeVerts(0.86);
  const frames = [];
  const D = 24, DUR = 12;
  for (let i = 0; i < D; i++) {
    const a = (i / D) * Math.PI * 2;
    const M = matmul(matmul(rotY(a), rotX(-0.4 + Math.sin(a * 2) * 0.14)), rotZ(0.3));
    frames.push({ verts: outer.map((v) => { const p = cam(apply(M, v)); return [p[0], p[1], p[2], p[3]]; }), edges: CUBE_EDGES });
  }
  const inner = cubeVerts(0.46);
  const iframes = frames.map((f, i) => {
    const a = (i / D) * Math.PI * 2;
    const M = matmul(rotY(-a * 1.4), rotX(0.4 + Math.sin(a * 3) * 0.1));
    return { verts: inner.map((v) => { const p = cam(apply(M, v)); return [p[0], p[1], p[2], p[3]]; }), edges: CUBE_EDGES };
  });

  const defs = [
    gradient('mg', [[0, t.glow], [0.5, t.glow2], [1, t.glow3]], { x1: 0, y1: 0, x2: 1, y2: 1 }),
    glowFilter('mgg', 3.2),
    radial('mh', [[0, t.glow2, 0.3], [1, t.glow2, 0]], { cx: 0.5, cy: 0.5, r: 0.5 }),
  ].join('\n');

  const body = `<ellipse cx="60" cy="60" rx="58" ry="58" fill="url(#mh)"/>
${renderEdges(frames, { edges: CUBE_EDGES, cx: 60, cy: 60, color: t.glow, width: 1.6, opacity: 0.95, dim: 0.25, dur: `${DUR}s` })}
${renderEdges(iframes, { edges: CUBE_EDGES, cx: 60, cy: 60, color: t.glow2, width: 1.1, opacity: 0.8, dim: 0.3, dur: `${DUR}s` })}
${renderPoints(frames, { cx: 60, cy: 60, color: t.glow3, r: 2.2, dur: `${DUR}s` })}`;

  return svgDoc({ w: S, h: S, theme: t, title: 'Aadrit logo mark', defs, body });
}

// ---------- self-hosted animated status badges ----------
function badge({ w, h, text, sub, color, theme, icon = 'dot', radius = 12 }) {
  const t = THEMES[theme];
  const cx = 18;
  const cy = h / 2;
  const hasIcon = icon !== 'none';
  const x0 = hasIcon ? 34 : 16;
  const gid = 'bg' + Math.abs(w);
  return svgDoc({
    w,
    h,
    theme: t,
    title: text,
    defs: [
      gradient('gbar' + gid, [[0, t.panel2], [1, t.panel]], { x1: 0, y1: 0, x2: 1, y2: 0.2 }),
      gradient('gedge' + gid, [[0, color, 0.9], [1, color, 0.15]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
      glowFilter('bglow' + gid, 2.6),
    ].join('\n'),
    body: `<rect x="0.6" y="0.6" width="${w - 1.2}" height="${h - 1.2}" rx="${radius}" fill="url(#gbar${gid})"/>
<rect x="0.6" y="0.6" width="${w - 1.2}" height="${h - 1.2}" rx="${radius}" fill="none" stroke="url(#gedge${gid})" stroke-width="1.2"/>
${
  hasIcon
    ? icon === 'pulse'
      ? `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}" opacity="0.35">
<animate attributeName="r" values="3;9;3" dur="2.4s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite"/>
</circle>
<circle cx="${cx}" cy="${cy}" r="4" fill="${color}" filter="url(#bglow${gid})"/>`
      : `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}" filter="url(#bglow${gid})"/>`
    : ''
}
<g font-family="${FONT_SANS}">
<text x="${x0}" y="${sub ? h / 2 - 2 : cy + 5}" font-size="13" font-weight="700" fill="${t.ink}" letter-spacing="0.3">${txt(text)}</text>
${sub ? `<text x="${x0}" y="${h / 2 + 13}" font-family="${FONT_MONO}" font-size="10" fill="${t.muted}" letter-spacing="1.2">${txt(sub)}</text>` : ''}
</g>`,
  });
}

export function badges(themeId = 'dark') {
  // Composed into one strip: available / location / role / focus
  const t = THEMES[themeId];
  const items = [
    { w: 150, text: 'Available', sub: 'open to collabs', color: '#34d399', icon: 'pulse' },
    { w: 130, text: 'India', sub: 'UTC +05:30', color: t.glow, icon: 'dot' },
    { w: 176, text: 'Full-Stack', sub: 'TS · Node · React', color: t.glow2, icon: 'dot' },
    { w: 160, text: 'Security', sub: 'offensive research', color: t.glow3, icon: 'dot' },
  ];
  const gap = 12;
  const W = items.reduce((a, i) => a + i.w, 0) + gap * (items.length - 1);
  const H = 44;
  const bodies = items
    .map((it, i) => {
      const x = items.slice(0, i).reduce((a, p) => a + p.w + gap, 0);
      return `<g transform="translate(${x} 0)">${badgeBody(it, t)}</g>`;
    })
    .join('\n');
  const defs = [
    gradient('stripbar', [[0, t.panel], [1, t.panel2]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    glowFilter('stglow', 2.6),
  ].join('\n');
  const body = `<rect width="${W}" height="${H}" fill="none"/>${bodies}`;
  void defs;
  void W;
  void H;
  return svgDoc({ w: items.reduce((a, i) => a + i.w, 0) + gap * (items.length - 1), h: H, theme: t, title: 'Status badges', defs, body });
}

function badgeBody(it, t) {
  const gid = 'b' + it.text.length + it.w;
  const cx = 18;
  const cy = 22;
  const x0 = 34;
  return `<rect x="0.6" y="0.6" width="${it.w - 1.2}" height="42.8" rx="12" fill="${t.panel}"/>
<rect x="0.6" y="0.6" width="${it.w - 1.2}" height="42.8" rx="12" fill="none" stroke="${it.color}" stroke-opacity="0.45" stroke-width="1.2"/>
${
  it.icon === 'pulse'
    ? `<circle cx="${cx}" cy="${cy}" r="4" fill="${it.color}" opacity="0.35"><animate attributeName="r" values="3;9;3" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="${cx}" cy="${cy}" r="4" fill="${it.color}"/>`
    : `<circle cx="${cx}" cy="${cy}" r="4" fill="${it.color}"/>`
}
<text x="${x0}" y="20" font-family="${FONT_SANS}" font-size="13" font-weight="700" fill="${t.ink}">${txt(it.text)}</text>
<text x="${x0}" y="35" font-family="${FONT_MONO}" font-size="10" fill="${t.muted}" letter-spacing="1">${txt(it.sub)}</text>
<rect x="0.6" y="41.4" width="${it.w - 1.2}" height="2" fill="${it.color}" opacity="0.5"><animate attributeName="width" values="0;${it.w - 1.2}" dur="1.2s" fill="freeze" begin="0.2s"/></rect>
${gid}`;
}

// ---------- section heading ----------
export function sectionHead(themeId = 'dark') {
  const t = THEMES[themeId];
  const W = 900, H = 56;
  const defs = [
    gradient('shg', [[0, t.glow], [1, t.glow2]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    glowFilter('shglow', 3),
  ].join('\n');
  const body = `<g>
<line x1="0" y1="28" x2="360" y2="28" stroke="url(#shg)" stroke-width="1.5" opacity="0.5">
<animate attributeName="x2" values="0;360" dur="1.1s" fill="freeze"/>
</line>
<line x1="540" y1="28" x2="900" y2="28" stroke="url(#shg)" stroke-width="1.5" opacity="0.5">
<animate attributeName="x1" values="900;540" dur="1.1s" fill="freeze"/>
</line>
<g transform="translate(450 28)">
<polygon points="-9,0 0,-9 9,0 0,9" fill="none" stroke="${t.glow}" stroke-width="1.5" filter="url(#shglow)">
<animateTransform attributeName="transform" type="rotate" values="0;360" dur="14s" repeatCount="indefinite"/>
</polygon>
<circle cx="0" cy="0" r="2.5" fill="${t.glow2}">
<animate attributeName="r" values="2;4.2;2" dur="2.6s" repeatCount="indefinite"/>
</circle>
</g>
</g>`;
  return svgDoc({ w: W, h: H, theme: t, title: 'Section divider', defs, body });
}

// ---------- timeline ----------
export function timeline(themeId = 'dark', data = {}) {
  const t = THEMES[themeId];
  const items = (data.repos || []).filter((r) => r.desc).slice(0, 4).map((r, i) => ({
    title: r.name,
    sub: r.desc || r.lang || '',
    color: [t.glow, t.glow2, t.glow3, '#34d399'][i % 4],
  }));
  const W = 900;
  const rowH = 78;
  const top = 46;
  const H = top + items.length * rowH + 30;
  const lineX = 34;

  let rows = '';
  items.forEach((it, i) => {
    const y = top + i * rowH + 22;
    const isLeft = i % 2 === 0;
    rows += `<g>
<circle cx="${lineX}" cy="${y}" r="9" fill="${t.panel}" stroke="${it.color}" stroke-width="2">
<animate attributeName="r" values="8;11;8" dur="${3 + i * 0.4}s" begin="${i * 0.3}s" repeatCount="indefinite"/>
</circle>
<circle cx="${lineX}" cy="${y}" r="3.4" fill="${it.color}"/>
<g transform="translate(${isLeft ? lineX + 34 : lineX - 34} ${y})" opacity="${isLeft ? 1 : 1}">
<text x="${isLeft ? 0 : 0}" y="-6" font-family="${FONT_SANS}" font-size="16" font-weight="700" fill="${it.color}" text-anchor="start">${txt(it.title)}</text>
<text x="0" y="14" font-family="${FONT_MONO}" font-size="11.5" fill="${t.muted}">${txt(clip(it.sub, 58))}</text>
</g>
<rect x="${isLeft ? lineX + 20 : 60}" y="${y - 15}" width="0" height="1" fill="${it.color}" opacity="0.6">
<animate attributeName="width" values="0;${isLeft ? 0 : 0}" dur="0.1s" fill="freeze"/>
</rect>
</g>`;
  });

  const defs = [
    gradient('tlg', [[0, t.glow], [0.5, t.glow2], [1, t.glow3]], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    glowFilter('tlglow', 3),
  ].join('\n');

  const lineH = (items.length - 1) * rowH + 44;
  const body = `<text x="${lineX}" y="24" font-family="${FONT_MONO}" font-size="12" letter-spacing="3.4" fill="url(#tlg)" text-anchor="middle" font-weight="700">BUILD LOG</text>
<line x1="${lineX}" y1="${top + 22}" x2="${lineX}" y2="${r2(top + lineH)}" stroke="url(#tlg)" stroke-width="1.5" opacity="0.45"/>
${rows}
<circle cx="${lineX}" cy="${r2(top + lineH)}" r="4" fill="${t.glow3}" filter="url(#tlglow)">
<animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
</circle>`;
  return svgDoc({ w: W, h: H, theme: t, title: 'Project timeline', defs, body });
}

// ---------- full-width footer ----------
export function footer(themeId = 'dark') {
  const t = THEMES[themeId];
  const W = 1200, H = 190;
  const rnd = mulberry32(88);
  const defs = [
    gradient('fwave1', [[0, t.glow, 0], [0.5, t.glow, 0.85], [1, t.glow, 0]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    gradient('fbody', [[0, t.bg0, 0], [1, t.bg0, 0.9]], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    glowFilter('fglow', 4),
    blurFilter('fblur', 10),
  ].join('\n');

  function waveLayer(color, yBase, amp, freq, dur, opacity, grad) {
    const steps = 48;
    const xs = Array.from({ length: steps + 1 }, (_, i) => (i / steps) * (W + 20) - 10);
    const pathFor = (ph, am) =>
      xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${r2(x)} ${r2(yBase + Math.sin((x / W) * Math.PI * 2 * freq + ph) * amp * am)}`).join('');
    const d0 = pathFor(0, 1), d1 = pathFor(Math.PI * 0.7, 0.5), d2 = pathFor(Math.PI * 1.5, 0.8);
    return `<path d="${d0}" fill="none" stroke="${grad ? `url(#${grad})` : color}" stroke-width="2" opacity="${opacity}" stroke-linecap="round">
<animate attributeName="d" values="${d0};${d1};${d2};${d0}" dur="${dur}s" repeatCount="indefinite"/>
</path>`;
  }

  const motes = Array.from({ length: 18 }, () => {
    const x = r2(rnd() * W);
    const col = [t.glow, t.glow2, t.glow3][Math.floor(rnd() * 3)];
    return `<circle cx="${x}" cy="${r2(rnd() * H)}" r="${r2(0.8 + rnd() * 1.4)}" fill="${col}" opacity="0.5">
<animate attributeName="cy" values="${r2(rnd() * H)};${r2(rnd() * H)}" dur="${r2(4 + rnd() * 6)}s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0.15;0.6;0.15" dur="${r2(3 + rnd() * 4)}s" repeatCount="indefinite"/>
</circle>`;
  }).join('\n');

  const body = `${motes}
<g opacity="0.85">
${waveLayer(t.glow, 96, 20, 1.8, 10, 0.6, 'fwave1')}
${waveLayer(t.glow2, 118, 14, 2.6, 14, 0.5)}
${waveLayer(t.glow3, 106, 9, 3.4, 18, 0.4)}
</g>
<g font-family="${FONT_MONO}" text-anchor="middle">
<text x="${W / 2}" y="52" font-size="13" letter-spacing="5" fill="${t.ink}" opacity="0.9">THANKS FOR SCROLLING</text>
<text x="${W / 2}" y="76" font-size="11" letter-spacing="3" fill="${t.muted}">github.com/Aadrit1234</text>
</g>
<rect y="${H - 90}" width="${W}" height="90" fill="url(#fbody)"/>`;

  return svgDoc({ w: W, h: H, theme: t, title: 'Footer', defs, body });
}

// ---------- composed hero scene (3 objects in one frame) ----------
export function scene(themeId = 'dark', data = {}) {
  const t = THEMES[themeId];
  const W = 1200, H = 440;
  const defs = [
    gradient('sbg', [[0, t.panel], [0.6, t.bg0], [1, t.panel]], { x1: 0, y1: 0, x2: 0.2, y2: 1 }),
    radial('sgl', [[0, t.glow, 0.16], [1, t.glow, 0]], { cx: 0.5, cy: 0.5, r: 0.5 }),
    glowFilter('sglow', 3.2),
    blurFilter('sblur', 16),
  ].join('\n');

  const cam = makeCamera({ dist: 5.6, fov: 3.2 });
  const D = 18, DUR = 18;
  const sph = icosphere(0);

  function framesOf(verts, speed, tilt) {
    const out = [];
    for (let i = 0; i < D; i++) {
      const a = (i / D) * Math.PI * 2;
      const M = matmul(rotY(a * speed), rotX(tilt + Math.sin(a * 2) * 0.12));
      out.push({ verts: verts.map((v) => { const p = cam(apply(M, v)); return [p[0], p[1], p[2], p[3]]; }) });
    }
    return out;
  }

  function edgesOf(list, mode) {
    const out = [];
    if (mode === 'cube') {
      for (const [a, b] of CUBE_EDGES) out.push([a, b]);
    } else {
      for (const f of sph.faces) for (let i = 0; i < 3; i++) out.push([f[i], f[(i + 1) % 3]]);
    }
    return out;
  }

  const cubeF = framesOf(cubeVerts(0.9), 1, -0.4);
  const cubeE = edgesOf(null, 'cube');
  const sphereF = framesOf(sph.verts, 0.75, -0.28);
  const sphereE = edgesOf(null, 'sph');

  const cx = W / 2, cy = H / 2 + 6;
  const body = `<rect width="${W}" height="${H}" rx="28" fill="url(#sbg)"/>
${starfield(W, H, 90, t, 17, { maxR: 1.5, dur: 5 })}
<ellipse cx="${cx}" cy="${cy}" rx="300" ry="220" fill="url(#sgl)"/>
<g transform="translate(${cx - 300} ${cy})">
${renderEdges(sphereF, { edges: sphereE, cx: 0, cy: 0, color: t.glow2, width: 0.6, opacity: 0.45, dim: 0.08, dur: `${DUR * 1.4}s` })}
</g>
<g transform="translate(${cx + 320} ${cy})">
${renderEdges(sphereF, { edges: sphereE, cx: 0, cy: 0, color: t.glow3, width: 0.6, opacity: 0.45, dim: 0.08, dur: `${DUR * 1.4}s` })}
</g>
<g transform="translate(${cx} ${cy})">
${renderEdges(cubeF, { edges: cubeE, cx: 0, cy: 0, color: t.glow, width: 1.6, opacity: 0.95, dim: 0.22, dur: `${DUR}s` })}
${renderPoints(cubeF, { cx: 0, cy: 0, color: t.glow2, r: 2.6, dur: `${DUR}s` })}
</g>
<g font-family="${FONT_MONO}" font-size="10.5" letter-spacing="3" text-anchor="middle" fill="${t.faint}" opacity="0.85">
<text x="${cx}" y="26">SECURITY  ·  SYSTEMS  ·  INTELLIGENCE</text>
</g>`;
  void data;
  return svgDoc({ w: W, h: H, theme: t, title: '3D scene', defs, body });
}
