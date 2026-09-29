import { THEMES, FONT_MONO, FONT_SANS, svgDoc, gradient, radial, glowFilter, blurFilter, noiseFilter, starfield, auroraBlobs, auroraDefs, gridFloor, scanSweep, r2, mulberry32, polylinePath } from '../lib/core.mjs';
import { transformSolid, cubeVerts, CUBE_EDGES, CUBE_FACES, makeCamera, rotX, rotY, rotZ, matmul, apply } from '../lib/three.mjs';
import { renderEdges, renderPoints } from '../lib/frames.mjs';

const W = 1400;
const H = 560;

function orbitRings(t) {
  const cxs = W / 2, cys = 250;
  const rings = [
    { rx: 470, ry: 132, rot: -14, w: 1.2, o: 0.5, c: t.glow, dash: '4 10', dur: 26 },
    { rx: 590, ry: 176, rot: 9, w: 1, o: 0.38, c: t.glow2, dash: '2 14', dur: 34 },
    { rx: 350, ry: 92, rot: 24, w: 1, o: 0.45, c: t.glow3, dash: '1 9', dur: 20 },
  ];
  let out = '';
  for (const r of rings) {
    out += `<g transform="rotate(${r.rot} ${cxs} ${cys})">
<ellipse cx="${cxs}" cy="${cys}" rx="${r.rx}" ry="${r.ry}" stroke="${r.c}" stroke-width="${r.w}" opacity="${r.o}" stroke-dasharray="${r.dash}"/>
<ellipse cx="${cxs}" cy="${cys}" rx="${r.rx}" ry="${r.ry}" stroke="${r.c}" stroke-width="${r.w * 2.4}" opacity="${r2(r.o * 0.13)}" filter="url(#soft)"/>
<animateTransform attributeName="transform" type="rotate" values="${r.rot} ${cxs} ${cys};${r.rot + 360} ${cxs} ${cys}" dur="${r.dur}s" repeatCount="indefinite"/>
</g>`;
    // travelling comet head on the ring
    out += `<g>
<circle cx="${cxs + r.rx}" cy="${cys}" r="3.4" fill="${r.c}" opacity="0.95" filter="url(#gGlow)"/>
<circle cx="${cxs + r.rx}" cy="${cys}" r="10" fill="${r.c}" opacity="0.18" filter="url(#soft)"/>
<animateMotion dur="${r.dur}s" repeatCount="indefinite" rotate="0">
<mpath href="#path${rings.indexOf(r)}"/>
</animateMotion>
</g>`;
  }
  for (let i = 0; i < rings.length; i++) {
    const r = rings[i];
    out += `<path id="path${i}" d="M${cxs} ${cys} m-${r.rx} 0 a${r.rx} ${r.ry} 0 1 0 ${r.rx * 2} 0 a${r.rx} ${r.ry} 0 1 0 ${-r.rx * 2} 0" fill="none" stroke="none" transform="rotate(${r.rot} ${cxs} ${cys})"/>`;
  }
  return out;
}

function circuitTraces(t) {
  const rnd = mulberry32(77);
  let out = `<g opacity="0.5">`;
  for (let i = 0; i < 14; i++) {
    let y = r2(rnd() * H);
    const dir = rnd() > 0.5 ? 1 : -1;
    let x = dir > 0 ? r2(rnd() * 200) : r2(W - rnd() * 200);
    let d = `M${x} ${y}`;
    const segs = 3 + Math.floor(rnd() * 3);
    for (let s = 0; s < segs; s++) {
      const len = r2(50 + rnd() * 150);
      x += len * dir;
      d += ` L${r2(x)} ${y}`;
      if (s < segs - 1) {
        const dy = r2((rnd() - 0.5) * 90);
        y += dy;
        d += ` L${r2(x)} ${r2(y)}`;
      }
    }
    out += `<path d="${d}" stroke="${t.grid}" stroke-width="1" opacity="0.5" fill="none"/><circle cx="${r2(x)}" cy="${r2(y)}" r="2.2" fill="${t.glow}" opacity="0.55"/>`;
  }
  out += `</g>`;
  return out;
}

function floatingCube(t, { cx, cy, size, dur, seedRot, opacity = 1 }) {
  const cam = makeCamera({ dist: 5.4, fov: 3.1 });
  const frames = [];
  const N = 30;
  const base = rotZ(seedRot);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const M = matmul(matmul(rotY(a * 1.6 + seedRot), rotX(-0.42 + Math.sin(a * 2) * 0.12)), base);
    const verts = cubeVerts(size).map((v) => {
      const m = apply(M, v);
      const p = cam(m);
      return [p[0], p[1], p[2], p[3]];
    });
    frames.push({ verts, edges: CUBE_EDGES, faces: CUBE_FACES });
  }
  return `<g opacity="${opacity}">
${renderEdges(frames, { edges: CUBE_EDGES, cx, cy, color: t.glow, width: 1.5, opacity: 0.95, dim: 0.18, dur: `${dur}s` })}
${renderPoints(frames, { cx, cy, color: t.glow, r: 2.4, dur: `${dur}s` })}
</g>`;
}

export function hero(themeId = 'dark') {
  const t = THEMES[themeId];
  const defs = [
    gradient('bgGrad', [[0, t.bg1], [0.55, t.bg0], [1, '#02030a']], { x1: 0, y1: 0, x2: 0.3, y2: 1 }),
    radial('vig', [[0.5, t.bg0, 0], [1, t.bg0, 0.85]], { cx: 0.5, cy: 0.45, r: 0.75 }),
    gradient('nameGrad', [[0, t.glow], [0.5, t.glow2], [1, t.glow3]], { x1: 0, y1: 0, x2: 1, y2: 0.3 }),
    gradient('roleGrad', [[0, t.glow, 0.95], [1, t.glow2, 0.9]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    gradient('ruleGrad', [[0, t.glow, 0], [0.5, t.glow, 0.85], [1, t.glow, 0]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    auroraDefs(t),
    glowFilter('gGlow', 3.4),
    glowFilter('gNameGlow', 12, { merge: false }),
    blurFilter('soft', 9),
    noiseFilter('grain', 0.9, 2, 3),
  ].join('\n');

  const body = `<rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
<g mask="url(#vigMask)">
${auroraBlobs(W, H, t, 23)}
${starfield(W, H, 150, t, 11)}
${circuitTraces(t)}
${orbitRings(t)}
${gridFloor(W, H, t, { horizon: 0.72, rows: 20, cols: 30, dur: 8 })}
${floatingCube(t, { cx: 168, cy: 196, size: 0.5, dur: 26, seedRot: 0.4, opacity: 0.55 })}
${floatingCube(t, { cx: 1240, cy: 168, size: 0.38, dur: 20, seedRot: 1.1, opacity: 0.45 })}
${scanSweep(W, H, t, { dur: 9, width: 0.14, y0: 0.02, y1: 0.72 })}
</g>
<rect width="${W}" height="${H}" fill="url(#vig)"/>
<rect width="${W}" height="${H}" filter="url(#grain)" opacity="${t.id === 'dark' ? 0.05 : 0.03}"/>

<g text-anchor="middle" font-family="${FONT_SANS}">
<text x="${W / 2}" y="128" font-family="${FONT_MONO}" font-size="17" letter-spacing="9.5" fill="${t.muted}" opacity="0.9">&lt;  SYSTEM ONLINE  &gt;</text>
<text x="${W / 2}" y="252" font-size="122" font-weight="800" letter-spacing="9" fill="url(#nameGrad)" filter="url(#gNameGlow)" opacity="0.9">AADRIT</text>
<text x="${W / 2}" y="252" font-size="122" font-weight="800" letter-spacing="9" fill="url(#nameGrad)">AADRIT</text>
<rect x="${W / 2 - 210}" y="284" width="420" height="1.5" fill="url(#ruleGrad)"><animate attributeName="width" values="0;420;420;0" dur="7s" repeatCount="indefinite"/><animate attributeName="x" values="${W / 2};${W / 2 - 210};${W / 2 - 210};${W / 2}" dur="7s" repeatCount="indefinite"/></rect>
<text x="${W / 2}" y="330" font-size="25" font-weight="600" fill="${t.ink}" letter-spacing="0.5">Full-Stack Engineer &#183; Offensive Security &#183; AI/ML</text>
<text x="${W / 2}" y="372" font-family="${FONT_MONO}" font-size="19" letter-spacing="4" fill="url(#roleGrad)">github.com/Aadrit1234</text>
</g>
<g font-family="${FONT_MONO}" font-size="13" letter-spacing="3.4" text-anchor="middle">
${['BUILD', 'BREAK', 'LEARN', 'REPEAT']
  .map((s, i) => {
    const x = 250 + i * 300;
    const col = [t.glow, t.glow2, t.glow3, t.glow][i];
    return `<text x="${x}" y="474" fill="${col}" opacity="0.92">${s}</text>
<rect x="${x - 4}" y="484" width="${s.length * 12 + 8}" height="1" fill="${col}" opacity="0.35">
<animate attributeName="width" values="0;${s.length * 12 + 8}" dur="1.1s" begin="${i * 0.18}s" fill="freeze"/>
<animate attributeName="opacity" values="0.9;0.25;0.9" dur="4s" begin="${i * 0.5}s" repeatCount="indefinite"/>
</rect>`;
  })
  .join('\n')}
</g>
<rect y="${H - 120}" width="${W}" height="120" fill="url(#fadeBottom)"/>
<linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.id === 'dark' ? '#05060f' : '#ffffff'}" stop-opacity="0"/><stop offset="1" stop-color="${t.id === 'dark' ? '#05060f' : '#ffffff'}" stop-opacity="1"/></linearGradient>`;

  const vigMask = `<defs>
${radial('vigGrad', [[0.35, '#fff', 1], [1, '#fff', 0]], { cx: 0.5, cy: 0.45, r: 0.72 })}
<mask id="vigMask"><rect width="${W}" height="${H}" fill="url(#vigGrad)"/></mask>
</defs>`;

  return svgDoc({
    w: W,
    h: H,
    theme: t,
    title: 'Aadrit — Full-Stack Engineer, Offensive Security, AI/ML',
    defs: defs + vigMask,
    body,
  });
}
