import { THEMES, FONT_MONO, svgDoc, gradient, radial, glowFilter, blurFilter, starfield, r2, txt, mulberry32 } from '../lib/core.mjs';
import { cubeVerts, CUBE_EDGES, CUBE_FACES, icosphere, sphereWire, torus, makeCamera, rotX, rotY, rotZ, matmul, apply } from '../lib/three.mjs';
import { renderEdges, renderFaces, renderPoints, renderLoops, morphFrames, morphNum } from '../lib/frames.mjs';

const D = 18; // frames per rotation cycle
const DUR = 16; // seconds per cycle

function frameSet(fn) {
  const out = [];
  for (let i = 0; i < D; i++) out.push(fn((i / D) * Math.PI * 2, i));
  return out;
}

function projectSolid(verts, M, cam, scale = 1) {
  return verts.map((v) => {
    const p = cam(apply(M, [v[0] * scale, v[1] * scale, v[2] * scale]));
    return [p[0], p[1], p[2], p[3]];
  });
}

function cubeStack(t, { cx, cy, size, seed = 0, dur = DUR }) {
  const cam = makeCamera({ dist: 5.6, fov: 3.2 });
  const outer = cubeVerts(size);
  const inner = cubeVerts(size * 0.52);
  const frames = frameSet((a) => {
    const M = matmul(rotY(a + seed), rotX(-0.38 + Math.sin(a * 2 + seed) * 0.16));
    return { verts: projectSolid(outer, M, cam), edges: CUBE_EDGES, faces: CUBE_FACES, inner: projectSolid(inner, M, cam) };
  });
  let out = renderFaces(frames, { cx, cy, faces: CUBE_FACES, fill: t.glow, opacity: 0.1, stroke: t.glow, strokeOpacity: 0.35, dur: `${dur}s`, backScale: 0.5 });
  out += renderEdges(frames, { edges: CUBE_EDGES, cx, cy, color: t.glow, width: 1.5, opacity: 0.95, dim: 0.2, dur: `${dur}s` });
  // counter-rotating inner core
  const innerFrames = frames.map((f) => ({ verts: f.inner }));
  out += renderEdges(innerFrames, { edges: CUBE_EDGES, cx, cy, color: t.glow2, width: 1.1, opacity: 0.8, dim: 0.25, dur: `${dur}s` });
  out += renderPoints(frames, { cx, cy, color: t.glow3, r: 2.6, dur: `${dur}s` });
  return out;
}

export function cube3d(themeId = 'dark') {
  const t = THEMES[themeId];
  const W = 420, H = 420;
  const defs = [
    gradient('cbg', [[0, t.panel], [1, t.bg0]], { x1: 0, y1: 0, x2: 0.4, y2: 1 }),
    radial('cglow', [[0, t.glow, 0.22], [1, t.glow, 0]], { cx: 0.5, cy: 0.5, r: 0.5 }),
    glowFilter('cg', 3),
    blurFilter('cb', 14),
  ].join('\n');

  const cam = makeCamera({ dist: 5.6, fov: 3.2 });
  const sph = icosphere(0);
  const sphereFrames = frameSet((a) => {
    const M = matmul(rotY(a * 0.7), rotX(-0.3 + Math.sin(a * 3) * 0.1));
    const pv = projectSolid(sph.verts, M, cam, 0.46);
    const edges = [];
    for (const f of sph.faces) for (let i = 0; i < 3; i++) edges.push([f[i], f[(i + 1) % 3]]);
    return { verts: pv, edges, faces: sph.faces };
  });

  const body = `<rect width="${W}" height="${H}" rx="26" fill="url(#cbg)"/>
<ellipse cx="${W / 2}" cy="${H / 2}" rx="200" ry="200" fill="url(#cglow)"/>
<ellipse cx="${W / 2}" cy="${H - 44}" rx="120" ry="20" fill="${t.glow}" opacity="0.13" filter="url(#cb)">
<animate attributeName="rx" values="110;132;110" dur="4s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0.09;0.17;0.09" dur="4s" repeatCount="indefinite"/>
</ellipse>
<g opacity="0.75">
${renderEdges(sphereFrames, { edges: sphereFrames[0].edges, cx: W / 2, cy: H / 2, color: t.glow2, width: 0.7, opacity: 0.55, dim: 0.1, dur: `${DUR * 1.6}s` })}
</g>
${cubeStack(t, { cx: W / 2, cy: H / 2, size: 0.86, seed: 0.3 })}
<g font-family="${FONT_MONO}" font-size="10" letter-spacing="3" fill="${t.faint}" text-anchor="middle" opacity="0.8">
<text x="${W / 2}" y="26">SOLID // ROT-3D</text>
</g>`;

  return svgDoc({ w: W, h: H, theme: t, title: 'Rotating 3D cube', defs, body });
}

export function globe(themeId = 'dark') {
  const t = THEMES[themeId];
  const W = 420, H = 420;
  const defs = [
    gradient('gbg', [[0, t.panel], [1, t.bg0]], { x1: 0, y1: 0, x2: 0.4, y2: 1 }),
    radial('gglow', [[0, t.glow2, 0.2], [1, t.glow2, 0]], { cx: 0.5, cy: 0.5, r: 0.5 }),
    glowFilter('gg', 3.2),
    blurFilter('gb', 12),
  ].join('\n');

  const cam = makeCamera({ dist: 5, fov: 3.1 });
  const sw = sphereWire(1, 10, 6, 26);
  const loopCount = sw.rings.length + sw.meridians.length;

  const frames = frameSet((a) => {
    const M = matmul(rotY(a * 0.8), rotX(-0.42));
    const project = (pts) => pts.map((p) => {
      const q = cam(apply(M, p));
      return [q[0], q[1], q[2]];
    });
    const loops = [];
    for (const r of sw.rings) loops.push(project(r));
    for (const m of sw.meridians) loops.push(project(m));
    return loops;
  });

  // Orbiting satellites on inclined rings.
  const sats = [];
  const rnd = mulberry32(41);
  for (let i = 0; i < 3; i++) {
    sats.push({
      r: 1.55 + i * 0.12,
      incl: [-0.5, 0.35, 0.9][i],
      speed: 1 + i * 0.35,
      phase: rnd() * Math.PI * 2,
      color: [t.glow, t.glow3, t.glow2][i],
      size: 3.4 - i * 0.5,
    });
  }

  const satMarkup = sats
    .map((s, i) => {
      const xs = [], ys = [];
      for (let f = 0; f <= 64; f++) {
        const a = (f / 64) * Math.PI * 2;
        const p = [Math.cos(a) * s.r, 0, Math.sin(a) * s.r];
        const q = cam(apply(rotX(s.incl), p));
        xs.push(r2(W / 2 + q[0]));
        ys.push(r2(H / 2 + q[1]));
      }
      let d = `M${xs[0]} ${ys[0]}`;
      for (let k = 1; k < xs.length; k++) d += `L${xs[k]} ${ys[k]}`;
      const cxs = [], cys = [];
      for (let f = 0; f < D; f++) {
        const a = s.phase + (f / D) * Math.PI * 2 * s.speed;
        const p = [Math.cos(a) * s.r, 0, Math.sin(a) * s.r];
        const q = cam(apply(rotX(s.incl), p));
        cxs.push(r2(W / 2 + q[0]));
        cys.push(r2(H / 2 + q[1]));
      }
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="0.8" opacity="0.3" stroke-dasharray="3 7"/>
<circle cx="${cxs[0]}" cy="${cys[0]}" r="${s.size}" fill="${s.color}" filter="url(#gg)" opacity="0.9">
${morphNum(cxs, { dur: `${DUR}s`, attr: 'cx' })}${morphNum(cys, { dur: `${DUR}s`, attr: 'cy' })}
<animate attributeName="r" values="${s.size};${s.size * 1.9};${s.size}" dur="2.4s" begin="${i * 0.7}s" repeatCount="indefinite"/>
</circle>`;
    })
    .join('\n');

  const body = `<rect width="${W}" height="${H}" rx="26" fill="url(#gbg)"/>
<ellipse cx="${W / 2}" cy="${H / 2}" rx="205" ry="205" fill="url(#gglow)"/>
<g>
${renderLoops(frames, { cx: W / 2, cy: H / 2, color: t.glow, width: 0.95, dur: `${DUR}s`, baseOpacity: 0.75, minOpacity: 0.08 })}
</g>
<circle cx="${W / 2}" cy="${H / 2}" r="0" fill="none"/>
<circle cx="${W / 2}" cy="${H / 2}" r="140" stroke="${t.glow}" stroke-width="0.8" opacity="0.18" stroke-dasharray="2 9"/>
<animateTransform attributeName="transform" type="rotate" values="0 ${W / 2} ${H / 2};360 ${W / 2} ${H / 2}" dur="${DUR * 2}s" repeatCount="indefinite"/>
${satMarkup}
<g font-family="${FONT_MONO}" font-size="10" letter-spacing="3" fill="${t.faint}" text-anchor="middle" opacity="0.8">
<text x="${W / 2}" y="26">MESH // ORBIT</text>
</g>`;

  return svgDoc({ w: W, h: H, theme: t, title: 'Rotating wireframe globe with orbiting nodes', defs, body });
}

const LAYERS = [
  { title: 'INTERFACE', color: '#22d3ee', skills: ['React', 'TypeScript', 'Next.js', 'Three.js', 'GSAP', 'Tailwind'] },
  { title: 'SERVICES', color: '#a855f7', skills: ['Node.js', 'Fastify', 'Postgres', 'Redis', 'Docker', 'Go'] },
  { title: 'INTEL', color: '#f472b6', skills: ['Burp', 'Nmap', 'Reverse Eng', 'Fuzzing', 'Crypto', 'CTF'] },
  { title: 'INTELLIGENCE', color: '#34d399', skills: ['PyTorch', 'LLMs', 'Agents', 'RAG', 'Pandas', 'Vision'] },
];

export function orbit3d(themeId = 'dark', data = {}) {
  const t = THEMES[themeId];
  const W = 900, H = 620;
  const defs = [
    gradient('obg', [[0, t.panel], [0.5, t.bg0], [1, t.panel]], { x1: 0, y1: 0, x2: 0.3, y2: 1 }),
    radial('ocore', [[0, '#ffffff', 0.95], [0.4, t.glow, 0.5], [1, t.glow, 0]], { cx: 0.5, cy: 0.5, r: 0.5 }),
    glowFilter('og', 3.6),
    blurFilter('ob', 16),
  ].join('\n');

  const cam = makeCamera({ dist: 6, fov: 3 });
  const cx = W / 2, cy = H / 2;
  const core = [];

  // Central polyhedral core.
  const sph = icosphere(0);
  const coreFrames = frameSet((a) => {
    const M = matmul(rotY(a * 1.4), rotX(a * 0.7));
    const pv = projectSolid(sph.verts, M, cam, 0.34);
    const edges = [];
    for (const f of sph.faces) for (let i = 0; i < 3; i++) edges.push([f[i], f[(i + 1) % 3]]);
    return { verts: pv, edges, faces: sph.faces };
  });
  core.push(renderFaces(coreFrames, { faces: sph.faces, cx, cy, fill: t.glow2, opacity: 0.16, stroke: t.glow2, strokeOpacity: 0.4, dur: `${DUR * 0.9}s`, backScale: 0.4 }));
  core.push(renderEdges(coreFrames, { edges: coreFrames[0].edges, cx, cy, color: t.glow, width: 0.8, opacity: 0.8, dim: 0.12, dur: `${DUR * 0.9}s` }));

  // Four inclined orbital shells, each carrying labeled skill nodes.
  let shells = '';
  LAYERS.forEach((layer, li) => {
    const incl = [-0.62, -0.2, 0.22, 0.64][li];
    const R = 1.75 + li * 0.42;
    const speed = 1 - li * 0.14;
    const tRim = torus(R, 0.004, 44, 4);
    const rimFrames = frameSet((a) => {
      const M = matmul(rotX(incl), rotY(a * speed));
      return tRim.map((loop) => loop.map((p) => {
        const q = cam(apply(M, p));
        return [q[0], q[1], q[2]];
      }));
    });
    shells += `<g>${renderLoops(rimFrames, { cx, cy, color: layer.color, width: 0.9, dur: `${DUR / speed}s`, baseOpacity: 0.5, minOpacity: 0.08 })}</g>`;

    layer.skills.forEach((name, si) => {
      const ang = (si / layer.skills.length) * Math.PI * 2;
      const n = 24;
      const xs = [], ys = [], ops = [], sc = [];
      for (let f = 0; f <= 16; f++) {
        const a = ang + (f / 16) * Math.PI * 2 * speed;
        const p = [Math.cos(a) * R, 0, Math.sin(a) * R];
        const q = cam(apply(rotX(incl), p));
        const z = q[2];
        const depth = Math.min(1, Math.max(0, (-z - 1.2) / 3.2));
        xs.push(r2(cx + q[0]));
        ys.push(r2(cy + q[1]));
        ops.push(0.2 + depth * 0.8);
        sc.push(0.72 + depth * 0.5);
      }
      const cw = 6.6;
      const label = txt(name.toUpperCase());
      shells += `<g opacity="0.9">
<circle cx="${xs[0]}" cy="${ys[0]}" r="3.4" fill="${layer.color}" filter="url(#og)">
${morphNum(xs, { dur: `${DUR / speed}s`, attr: 'cx' })}${morphNum(ys, { dur: `${DUR / speed}s`, attr: 'cy' })}${morphNum(ops, { dur: `${DUR / speed}s`, attr: 'opacity' })}
<animate attributeName="r" values="3.4;4.6;3.4" dur="${2.2 + si * 0.3}s" begin="${si * 0.25}s" repeatCount="indefinite"/>
</circle>
<text x="${xs[0]}" y="${ys[0] - 12}" font-family="${FONT_MONO}" font-size="10" letter-spacing="1.6" fill="${layer.color}" text-anchor="middle" opacity="${ops[0]}">${label}
${morphNum(xs, { dur: `${DUR / speed}s`, attr: 'x' })}${morphNum(ys.map((v) => r2(v - 12)), { dur: `${DUR / speed}s`, attr: 'y' })}${morphNum(ops, { dur: `${DUR / speed}s`, attr: 'opacity' })}
</text>
</g>`;
      void cw;
      void n;
    });
  });

  const stars = starfield(W, H, 60, t, 91, { maxR: 1.3, dur: 5 });
  const body = `<rect width="${W}" height="${H}" rx="28" fill="url(#obg)"/>
${stars}
<ellipse cx="${cx}" cy="${cy}" rx="120" ry="120" fill="url(#ocore)" opacity="0.5" filter="url(#ob)">
<animate attributeName="rx" values="104;132;104" dur="6s" repeatCount="indefinite"/>
<animate attributeName="ry" values="104;132;104" dur="6s" repeatCount="indefinite"/>
</ellipse>
${shells}
${core.join('\n')}
<circle cx="${cx}" cy="${cy}" r="7" fill="#fff" filter="url(#og)">
<animate attributeName="r" values="6;9;6" dur="3s" repeatCount="indefinite"/>
</circle>
<g font-family="${FONT_MONO}" font-size="10" letter-spacing="3.4" fill="${t.faint}" text-anchor="middle" opacity="0.85">
<text x="${cx}" y="28">SKILL CONSTELLATION</text>
</g>
<g font-family="${FONT_MONO}" font-size="10.5" letter-spacing="2" text-anchor="middle">
${LAYERS.map((l, i) => `<text x="${cx}" y="${H - 20 - i * 15}" fill="${l.color}" opacity="0.8">${l.title}</text>`).join('\n')}
</g>`;

  void data;
  return svgDoc({ w: W, h: H, theme: t, title: 'Skill constellation — 3D orbital shells', defs, body });
}
