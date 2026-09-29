// Replaces the build script with the full asset pipeline.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hero } from './assets/hero.mjs';
import { typing } from './assets/typing.mjs';
import { cube3d, globe, orbit3d } from './assets/objects.mjs';
import { terminal } from './assets/terminal.mjs';
import { waves, pulse, matrix, card, projectCard } from './assets/panels.mjs';
import { footer, badges, sectionHead, mark, timeline, scene } from './assets/chrome.mjs';
import { stats } from './data/stats.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets');
mkdirSync(out, { recursive: true });

const data = stats();

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const wantLight = process.argv.includes('--light-only') ? true : process.argv.includes('--no-light') ? false : true;
const themes = wantLight ? ['dark', 'light'] : ['dark'];

// Featured projects get a card each; empty ones are skipped.
const featured = data.repos.filter((r) => r.desc && r.langs && r.langs.length);
const builders = {
  hero: (t) => hero(t),
  typing: (t) => typing(t),
  cube3d: (t) => cube3d(t),
  globe: (t) => globe(t),
  orbit3d: (t) => orbit3d(t, data),
  terminal: (t) => terminal(t),
  waves: (t) => waves(t),
  pulse: (t) => pulse(t, data),
  matrix: (t) => matrix(t),
  card: (t) => card(t, data),
  footer: (t) => footer(t),
  badges: (t) => badges(t, data),
  mark: (t) => mark(t),
  sectionHead: (t) => sectionHead(t),
  timeline: (t) => timeline(t, data),
  scene: (t) => scene(t, data),
  ...Object.fromEntries(featured.map((r) => [`project-${r.name}`, (t) => projectCard(t, r)])),
};
const names = only.length ? only : Object.keys(builders);

let total = 0;
for (const name of names) {
  if (!builders[name]) { console.error(`no builder: ${name}`); continue; }
  for (const th of themes) {
    const svg = builders[name](th);
    const file = join(out, `${name}${th === 'light' ? '-light' : ''}.svg`);
    writeFileSync(file, svg);
    total += svg.length;
    console.log(`${(name + (th === 'light' ? '-light' : '') + '.svg').padEnd(24)} ${(svg.length / 1024).toFixed(1).padStart(7)} KB`);
  }
}
console.log(`\ntotal ${(total / 1024).toFixed(1)} KB across ${names.length * themes.length} files`);
console.log(`featured projects: ${featured.map((r) => r.name).join(', ') || 'none'}`);
void readFileSync;
