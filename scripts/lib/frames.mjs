import { centroidZ } from './three.mjs';

const f2 = (n) => Math.round(n * 10) / 10;

export function dFromPoints(pts, close = true) {
  if (!pts.length) return 'M0 0';
  let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += `L${f2(pts[i][0])} ${f2(pts[i][1])}`;
  return close ? d + 'Z' : d;
}

export function morphFrames(dList, { dur, repeat = 'indefinite', begin = 0 }) {
  const values = dList.join(';');
  return `<animate attributeName="d" values="${values}" dur="${dur}" begin="${begin}s" calcMode="discrete" repeatCount="${repeat}"/>`;
}

export function morphNum(values, { dur, attr, repeat = 'indefinite', begin = 0, calcMode = 'discrete' }) {
  return `<animate attributeName="${attr}" values="${values.join(';')}" dur="${dur}" begin="${begin}s" calcMode="${calcMode}" repeatCount="${repeat}"/>`;
}

export function smoothNum(values, { dur, attr, repeat = 'indefinite', begin = 0, keyTimes, spline = '0.4 0 0.6 1', calcMode = 'spline' }) {
  const n = values.length;
  const kt = keyTimes || Array.from({ length: n }, (_, i) => (n === 1 ? 1 : i / (n - 1)));
  if (calcMode !== 'spline') {
    return `<animate attributeName="${attr}" values="${values.join(';')}" keyTimes="${kt.join(';')}" calcMode="${calcMode}" dur="${dur}" begin="${begin}s" repeatCount="${repeat}"/>`;
  }
  return `<animate attributeName="${attr}" values="${values.join(';')}" keyTimes="${kt.join(';')}" calcMode="spline" keySplines="${Array.from({ length: n - 1 }, () => spline).join(';')}" dur="${dur}" begin="${begin}s" repeatCount="${repeat}"/>`;
}

export function transformFrames(list, { dur, repeat = 'indefinite', type = 'translate', begin = 0 }) {
  return `<animateTransform attributeName="transform" type="${type}" values="${list.join(';')}" dur="${dur}" begin="${begin}s" calcMode="discrete" repeatCount="${repeat}"/>`;
}

// Painter's-algorithm face rendering for a solid. `solid` is a frames array; face indices in opts.
export function renderFaces(frames, { cx = 0, cy = 0, faces, opacity = 0.16, strokeWidth = 1, fill = '#fff', stroke = '#fff', strokeOpacity = 0.55, dur = '12s', backScale = 0.72 } = {}) {
  const count = faces.length;
  let out = '';
  for (let i = 0; i < count; i++) {
    const face = faces[i];
    const ds = [];
    const zs = [];
    const ops = [];
    for (const fr of frames) {
      const pts = face.map((k) => [cx + fr.verts[k][0], cy + fr.verts[k][1]]);
      ds.push(dFromPoints(pts));
      const z = face.reduce((a, k) => a + fr.verts[k][2], 0) / face.length;
      zs.push(z);
      const front = z < 0;
      ops.push(front ? opacity : opacity * backScale);
    }
    // draw back-to-front: sort by mean z descending (camera looks down -z)
    const order = zs.map((z, idx) => [z, idx]).sort((a, b) => b[0] - a[0]);
    const zOrder = order.map((o) => o[1]);
    out += `<path d="${ds[0]}" fill="${fill}" fill-opacity="${ops[0]}" stroke="${stroke}" stroke-opacity="${strokeOpacity}" stroke-width="${strokeWidth}" stroke-linejoin="round">${morphFrames(zOrder.map((k) => ds[k]), { dur })}${morphNum(zOrder.map((k) => ops[k]), { dur, attr: 'fill-opacity' })}</path>\n`;
  }
  return out;
}

export function renderEdges(frames, { edges, cx = 0, cy = 0, color = '#fff', width = 1.4, opacity = 0.9, dim = 0.28, dur = '12s', glowFilterId = '' } = {}) {
  const count = edges.length;
  let out = '';
  for (let i = 0; i < count; i++) {
    const e = edges[i];
    const ds = [];
    const ops = [];
    for (const fr of frames) {
      const a = fr.verts[e[0]], b = fr.verts[e[1]];
      ds.push(`M${f2(cx + a[0])} ${f2(cy + a[1])}L${f2(cx + b[0])} ${f2(cy + b[1])}`);
      const z = (a[2] + b[2]) / 2;
      const t = Math.min(1, Math.max(0, (-z - 0.6) / 3.2));
      ops.push(lerpOp(dim, opacity, t));
    }
    out += `<path d="${ds[0]}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${ops[0]}"${glowFilterId ? ` filter="url(#${glowFilterId})"` : ''}>${morphFrames(ds, { dur })}${morphNum(ops, { dur, attr: 'opacity' })}</path>\n`;
  }
  return out;
}

function lerpOp(a, b, t) {
  return Math.round((a + (b - a) * t) * 100) / 100;
}

export function renderPoints(frames, { cx = 0, cy = 0, color = '#fff', r = 3, dur = '12s', glow = '' } = {}) {
  const count = frames[0].verts.length;
  let out = '';
  for (let i = 0; i < count; i++) {
    const xs = [], ys = [], rs = [], ops = [];
    for (const fr of frames) {
      const v = fr.verts[i];
      xs.push(f2(cx + v[0]));
      ys.push(f2(cy + v[1]));
      const t = Math.min(1, Math.max(0, (-v[2] - 0.6) / 3.2));
      rs.push(f2(r * (0.55 + t * 0.85)));
      ops.push(lerpOp(0.15, 1, t));
    }
    out += `<circle cx="${xs[0]}" cy="${ys[0]}" r="${rs[0]}" fill="${color}" opacity="${ops[0]}"${glow ? ` filter="url(#${glow})"` : ''}>${morphNum(xs, { dur, attr: 'cx' })}${morphNum(ys, { dur, attr: 'cy' })}${smoothNum(rs, { dur, attr: 'r', calcMode: 'discrete' })}${morphNum(ops, { dur, attr: 'opacity' })}</circle>\n`;
  }
  return out;
}

// Render a polyline loop collection (sphere/torus) with depth-aware opacity.
export function renderLoops(loopsPerFrame, { cx = 0, cy = 0, color = '#fff', width = 1, dur = '14s', baseOpacity = 0.8, minOpacity = 0.1, glow = '' } = {}) {
  const frames = loopsPerFrame;
  const count = frames[0].length;
  let out = '';
  for (let i = 0; i < count; i++) {
    const ds = [];
    const ops = [];
    for (const fr of frames) {
      const pts = fr[i];
      ds.push(dFromPoints(pts, false));
      let zsum = 0;
      for (const p of pts) zsum += p[2];
      const z = zsum / pts.length;
      const t = Math.min(1, Math.max(0, (-z - 0.7) / 3.0));
      ops.push(lerpOp(minOpacity, baseOpacity, t));
    }
    out += `<path d="${ds[0]}" stroke="${color}" stroke-width="${width}" opacity="${ops[0]}" fill="none" stroke-linecap="round"${glow ? ` filter="url(#${glow})"` : ''}>${morphFrames(ds, { dur })}${morphNum(ops, { dur, attr: 'opacity' })}</path>\n`;
  }
  return out;
}

export { centroidZ };
