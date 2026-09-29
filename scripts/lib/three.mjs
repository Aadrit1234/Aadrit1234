// Minimal 3D engine: perspective camera, rotation matrices, wireframe solid generation.
export function rotX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[1, 0, 0], [0, c, -s], [0, s, c]];
}
export function rotY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
}
export function rotZ(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}
export function matmul(A, B) {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j];
  return C;
}
export function apply(M, v) {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

export function makeCamera({ dist = 5.2, fov = 3.0 }) {
  return function project(p) {
    const z = p[2] - dist;
    const s = fov / (fov - z);
    return [p[0] * s, -p[1] * s, z, s];
  };
}

export function cubeVerts(s = 1) {
  const v = [];
  for (const x of [-s, s]) for (const y of [-s, s]) for (const z of [-s, s]) v.push([x, y, z]);
  return v;
}
export const CUBE_EDGES = [
  [0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3],
  [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7],
];
export const CUBE_FACES = [
  [0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5],
];

// Icosphere via icosahedron subdivision.
export function icosphere(subdiv = 1) {
  const t = (1 + Math.sqrt(5)) / 2;
  let verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((p) => {
    const l = Math.hypot(p[0], p[1], p[2]);
    return [p[0] / l, p[1] / l, p[2] / l];
  });
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let s = 0; s < subdiv; s++) {
    const cache = new Map();
    const mid = (a, b) => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (cache.has(key)) return cache.get(key);
      const p = [
        (verts[a][0] + verts[b][0]) / 2,
        (verts[a][1] + verts[b][1]) / 2,
        (verts[a][2] + verts[b][2]) / 2,
      ];
      const l = Math.hypot(p[0], p[1], p[2]);
      verts.push([p[0] / l, p[1] / l, p[2] / l]);
      const i = verts.length - 1;
      cache.set(key, i);
      return i;
    };
    const nf = [];
    for (const [a, b, c] of faces) {
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = nf;
  }
  return { verts, faces };
}

export function sphereWire(radius = 1, meridians = 12, parallels = 7, seg = 48) {
  const rings = [];
  for (let i = 0; i < parallels; i++) {
    const lat = -Math.PI / 2 + (Math.PI * (i + 1)) / (parallels + 1);
    const r = radius * Math.cos(lat);
    const y = radius * Math.sin(lat);
    const pts = [];
    for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      pts.push([r * Math.cos(a), y, r * Math.sin(a)]);
    }
    rings.push(pts);
  }
  const merid = [];
  for (let i = 0; i < meridians; i++) {
    const a = (i / meridians) * Math.PI * 2;
    const pts = [];
    for (let j = 0; j <= seg; j++) {
      const t = (j / seg) * Math.PI * 2;
      pts.push([radius * Math.cos(t) * Math.cos(a), radius * Math.sin(t), radius * Math.cos(t) * Math.sin(a)]);
    }
    merid.push(pts);
  }
  return { rings, meridians: merid };
}

// Torus wireframe in XZ plane.
export function torus(R = 1, r = 0.36, seg = 72, ring = 10) {
  const loops = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const cx = R * Math.cos(a), cz = R * Math.sin(a);
    const pts = [];
    for (let j = 0; j <= ring; j++) {
      const b = (j / ring) * Math.PI * 2;
      const rr = r * Math.cos(b);
      pts.push([cx + rr * Math.cos(a), r * Math.sin(b), cz + rr * Math.sin(a)]);
    }
    loops.push(pts);
  }
  return loops;
}

export function depthOf(p) {
  return p[2];
}

// Returns {edges:[[a,b]...], faces:[[i,i,i,i]], verts:[[x,y,z,scale]]}
export function transformSolid({ verts, edges, faces }, M, camera, center = [0, 0, 0], scale = 1) {
  const tv = verts.map((v) => {
    const m = apply(M, [v[0] * scale + center[0], v[1] * scale + center[1], v[2] * scale + center[2]]);
    const p = camera(m);
    return [p[0], p[1], p[2], p[3]];
  });
  return { verts: tv, edges, faces };
}

export function centroidZ(verts, idxs) {
  return idxs.reduce((a, i) => a + verts[i][2], 0) / idxs.length;
}
