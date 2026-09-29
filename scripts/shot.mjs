import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const [, , svgArg, outArg, wArg, hArg, delayArg, themeArg] = process.argv;
if (!svgArg) {
  console.error('usage: node scripts/shot.mjs <svg|html> [out.png] [w] [h] [delayMs] [dark|light]');
  process.exit(1);
}
const abs = resolve(svgArg);
const W = Number(wArg || 1400);
const H = Number(hArg || 700);
const delay = Number(delayArg || 2200);
const out = resolve(outArg || join('shots', basename(abs, extname(abs)) + '.png'));
mkdirSync(join(resolve('shots')), { recursive: true });

let target = abs;
if (extname(abs) === '.svg') {
  const html = abs.replace(/\.svg$/, '.preview.html');
  const bg = themeArg === 'light' ? '#ffffff' : '#0b0b12';
  writeFileSync(
    html,
    `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:${bg}}img{display:block;width:100%}</style></head><body><img src="${basename(abs)}"></body></html>`
  );
  target = html;
}

const args = [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--screenshot=${out}`,
  `--window-size=${W},${H}`,
  `--virtual-time-budget=${delay}`,
  `file:///${target.replace(/\\/g, '/')}`,
];
try {
  execFileSync(EDGE, args, { stdio: 'ignore' });
} catch (e) {
  console.error('edge failed', e.message);
  process.exit(1);
}
console.log(`shot: ${out} (${W}x${H})`);
void readFileSync;
