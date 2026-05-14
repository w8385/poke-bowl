import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'data/source/ball_catalog.sample.csv');
const outDir = path.join(root, 'client/public/balls');

function parseCsv(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const headers = header.split(',');
  return lines.map((line) => Object.fromEntries(headers.map((h, i) => [h, line.split(',')[i] ?? ''])));
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} ${url}`));
        res.resume();
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

const rows = parseCsv(fs.readFileSync(sourcePath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

for (const row of rows) {
  const remoteName = row.ball_key.replaceAll('-', '');
  const url = `https://www.serebii.net/itemdex/sprites/${remoteName}.png`;
  const dest = path.join(outDir, `${row.ball_key}.png`);
  await download(url, dest);
  console.log(`fetched ${row.ball_key}`);
}

console.log(`Fetched ${rows.length} official ball icons into ${outDir}`);
