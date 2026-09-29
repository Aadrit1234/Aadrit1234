// Live GitHub data, cached to data/cache.json so builds are reproducible and offline-safe.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cachePath = join(root, 'data', 'cache.json');

const FALLBACK = {
  user: 'Aadrit1234',
  name: 'Aadrit',
  followers: 0,
  publicRepos: 7,
  totalStars: 3,
  createdAt: '2025-07-01',
  languages: [
    { name: 'JavaScript', bytes: 1900000, color: '#f1e05a' },
    { name: 'CSS', bytes: 480000, color: '#563d7c' },
    { name: 'HTML', bytes: 1060000, color: '#e34c26' },
    { name: 'TypeScript', bytes: 283000, color: '#3178c6' },
    { name: 'Python', bytes: 8600, color: '#3572A5' },
  ],
  repos: [
    { name: 'conduit', desc: 'Conduit — E2E-encrypted real-time collaboration rooms (chat, WebRTC file transfer, Vite + Fastify + Postgres)', lang: 'TypeScript', langs: [{ name: 'TypeScript', size: 283256 }, { name: 'CSS', size: 64073 }], stars: 1, forks: 0, demo: '', updated: '2026-08-18' },
    { name: 'printbridge', desc: 'Self-hosted print server: upload from anywhere, preview exactly what prints, and print on a Wi-Fi or USB printer — unattended.', lang: 'JavaScript', langs: [{ name: 'JavaScript', size: 843728 }, { name: 'CSS', size: 163825 }], stars: 1, forks: 0, demo: '', updated: '2026-09-21' },
    { name: 'filemorph', desc: 'Free online file converter & audio transcriber. Documents, images and audio converted with full content preservation.', lang: 'CSS', langs: [{ name: 'CSS', size: 60092 }, { name: 'JavaScript', size: 57939 }, { name: 'HTML', size: 22955 }], stars: 0, forks: 0, demo: '', updated: '2026-09-29' },
    { name: 'FormulaVault', desc: 'Offline-first study app for CBSE 11/12 and JEE — 833 formula cards, typo-tolerant search, AI tutor on your own API key.', lang: 'HTML', langs: [{ name: 'HTML', size: 568047 }, { name: 'JavaScript', size: 435072 }], stars: 0, forks: 0, demo: '', updated: '2026-09-26' },
    { name: 'prompt-forge', desc: 'Describe the task, get the prompt that actually works. Five AI backends and per-request model selection.', lang: 'JavaScript', langs: [{ name: 'JavaScript', size: 78165 }, { name: 'CSS', size: 28279 }], stars: 1, forks: 0, demo: '', updated: '2026-08-26' },
    { name: 'blu-blu', desc: null, lang: null, langs: [], stars: 0, forks: 0, demo: '', updated: '2026-08-11' },
  ],
  contributions: [],
  fetchedAt: null,
  stale: true,
};

function gh(path) {
  const r = execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(r);
}

function collectContributions(repos) {
  // Build a date->count map from each repo's commit history.
  const days = new Map();
  for (const repo of repos) {
    for (let page = 1; page <= 3; page++) {
      let commits;
      try {
        commits = gh(`repos/${repo}/commits?per_page=100&page=${page}`);
      } catch {
        break;
      }
      if (!Array.isArray(commits) || commits.length === 0) break;
      for (const c of commits) {
        const iso = (c.commit?.author?.date || c.commit?.committer?.date || '').slice(0, 10);
        if (!iso) continue;
        days.set(iso, (days.get(iso) || 0) + 1);
      }
      if (commits.length < 100) break;
    }
  }
  return [...days.entries()].map(([date, count]) => ({ date, count }));
}

export function stats({ refresh = false } = {}) {
  mkdirSync(join(root, 'data'), { recursive: true });
  if (!refresh && existsSync(cachePath)) {
    try {
      const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
      const ageH = (Date.now() - new Date(cached.fetchedAt).getTime()) / 3600000;
      if (ageH < 12) return cached;
    } catch {
      /* fall through to fetch */
    }
  }
  try {
    const u = gh('user');
    const reposMeta = gh('users/Aadrit1234/repos?per_page=100&sort=updated');
    const own = reposMeta.filter((r) => !r.fork && r.name !== 'Aadrit1234');

    const langMap = new Map();
    const repoLangs = new Map();
    let totalStars = 0;
    for (const r of own) {
      totalStars += r.stargazers_count || 0;
      try {
        const langs = gh(`repos/Aadrit1234/${r.name}/languages`);
        const list = Object.entries(langs)
          .map(([name, bytes]) => ({ name, size: bytes }))
          .sort((a, b) => b.size - a.size);
        repoLangs.set(r.name, list);
        for (const l of list) langMap.set(l.name, (langMap.get(l.name) || 0) + l.size);
      } catch {
        /* ignore */
      }
    }

    const contributions = collectContributions(own.map((r) => `Aadrit1234/${r.name}`));
    const commits = contributions.reduce((a, c) => a + c.count, 0);

    const languages = [...langMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, bytes]) => ({ name, bytes }));
    const data = {
      user: u.login,
      name: u.name || u.login,
      bio: u.bio,
      location: u.location,
      followers: u.followers,
      publicRepos: u.public_repos,
      totalStars,
      commits,
      createdAt: (u.created_at || '').slice(0, 10),
      languages,
      repos: own
        .map((r) => ({
          name: r.name,
          desc: r.description,
          lang: r.language,
          langs: repoLangs.get(r.name) || [],
          stars: r.stargazers_count,
          forks: r.forks_count,
          demo: r.homepage || '',
          updated: (r.pushed_at || '').slice(0, 10),
        }))
        .sort((a, b) => (a.updated < b.updated ? 1 : -1)),
      contributions,
      fetchedAt: new Date().toISOString(),
      stale: false,
    };
    writeFileSync(cachePath, JSON.stringify(data, null, 2));
    return data;
  } catch (e) {
    console.error('data fetch failed, using fallback:', e.message);
    return existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : FALLBACK;
  }
}
