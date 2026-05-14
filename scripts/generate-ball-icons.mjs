import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'data/source/ball_catalog.sample.csv');
const outDir = path.join(root, 'client/public/balls');

const colors = {
  'poke-ball': ['#ef4444', '#ffffff', '#111827'],
  'great-ball': ['#2563eb', '#ffffff', '#ef4444'],
  'ultra-ball': ['#111827', '#facc15', '#6b7280'],
  'master-ball': ['#9333ea', '#f9a8d4', '#111827'],
  'premier-ball': ['#ffffff', '#ffffff', '#ef4444'],
  'heal-ball': ['#f9a8d4', '#ffffff', '#ec4899'],
  'net-ball': ['#06b6d4', '#ffffff', '#f59e0b'],
  'nest-ball': ['#84cc16', '#ffffff', '#8b5e3c'],
  'dive-ball': ['#0ea5e9', '#ffffff', '#1d4ed8'],
  'dusk-ball': ['#65a30d', '#111827', '#ef4444'],
  'timer-ball': ['#ef4444', '#ffffff', '#111827'],
  'quick-ball': ['#2563eb', '#facc15', '#ef4444'],
  'repeat-ball': ['#ef4444', '#f59e0b', '#111827'],
  'luxury-ball': ['#111827', '#fbbf24', '#fbbf24'],
  'fast-ball': ['#facc15', '#ffffff', '#ef4444'],
  'friend-ball': ['#22c55e', '#ffffff', '#f472b6'],
  'moon-ball': ['#1f2937', '#ffffff', '#60a5fa'],
  'lure-ball': ['#2563eb', '#ffffff', '#ef4444'],
  'love-ball': ['#f9a8d4', '#ffffff', '#e11d48'],
  'level-ball': ['#ef4444', '#111827', '#ffffff'],
  'heavy-ball': ['#6b7280', '#ffffff', '#111827'],
  'dream-ball': ['#f472b6', '#ffffff', '#9333ea'],
  'beast-ball': ['#1d4ed8', '#111827', '#ef4444'],
  'safari-ball': ['#65a30d', '#fef08a', '#8b5e3c'],
  'sport-ball': ['#ef4444', '#ffffff', '#f59e0b'],
  'strange-ball': ['#9ca3af', '#ffffff', '#6366f1'],
  'cherish-ball': ['#dc2626', '#ffffff', '#111827'],
};

function parseCsv(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const headers = header.split(',');
  return lines.map((line) => Object.fromEntries(headers.map((h, i) => [h, line.split(',')[i] ?? ''])));
}

function iconSvg([top, bottom, accent], label) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="48" r="42" fill="${bottom}" stroke="#111827" stroke-width="4"/>
  <path d="M6 48C6 24.804 24.804 6 48 6C71.196 6 90 24.804 90 48H6Z" fill="${top}" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
  <rect x="6" y="44" width="84" height="8" fill="#111827"/>
  <circle cx="48" cy="48" r="13" fill="white" stroke="#111827" stroke-width="4"/>
  <circle cx="48" cy="48" r="6" fill="${accent}"/>
  <text x="48" y="84" text-anchor="middle" font-size="8" font-family="Arial, Helvetica, sans-serif" fill="#374151">${label}</text>
</svg>`;
}

const rows = parseCsv(fs.readFileSync(sourcePath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
for (const row of rows) {
  const key = row.ball_key;
  const palette = colors[key] ?? ['#e5e7eb', '#ffffff', '#6b7280'];
  const svg = iconSvg(palette, row.ball_name_en.replace(' Ball', ''));
  fs.writeFileSync(path.join(outDir, `${key}.svg`), svg);
}

console.log(`Generated ${rows.length} ball icons in ${outDir}`);
