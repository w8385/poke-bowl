import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'data/source/pokemon_ball_matches.sample.csv');
const ballCatalogPath = path.join(root, 'data/source/ball_catalog.sample.csv');
const outputPath = path.join(root, 'data/generated/ball-matches.json');
const searchIndexPath = path.join(root, 'data/generated/search-index.json');
const ballCatalogOutputPath = path.join(root, 'data/generated/ball-catalog.json');
const publicPath = path.join(root, 'client/public/data/ball-matches.json');
const publicSearchIndexPath = path.join(root, 'client/public/data/search-index.json');
const publicBallCatalogPath = path.join(root, 'client/public/data/ball-catalog.json');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function splitCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  out.push(current);
  return out;
}

function toList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readBallCatalog() {
  if (!fs.existsSync(ballCatalogPath)) return new Map();
  const csv = fs.readFileSync(ballCatalogPath, 'utf8');
  const rows = parseCsv(csv);
  return new Map(
    rows.map((row) => [
      row.ball_key,
      {
        key: row.ball_key,
        nameKo: row.ball_name_ko,
        nameEn: row.ball_name_en,
        rarityTier: row.rarity_tier,
        officialName: row.official_name,
        colorTags: toList(row.color_tags),
        iconPath: `/balls/${row.ball_key}.png`,
        sortOrder: Number(row.sort_order || 0),
      },
    ]),
  );
}

function normalizeLegalityStatus(value) {
  const allowed = new Set(['official', 'limited', 'check']);
  if (!value) return 'check';
  if (!allowed.has(value)) {
    throw new Error(`Invalid legality_status: ${value}`);
  }
  return value;
}

function validateBallKeys(keys, ballCatalog, slug) {
  if (!ballCatalog.size) return;
  for (const key of keys) {
    if (!ballCatalog.has(key)) {
      throw new Error(`Unknown ball key '${key}' for slug=${slug}`);
    }
  }
}

function transformRow(row, ballCatalog) {
  if (row.published !== 'TRUE') return null;
  if (!row.dex || !row.slug || !row.name_ko || !row.recommended_ball) {
    throw new Error(`Required field missing for slug=${row.slug || '(empty)'}`);
  }

  const altBalls = toList(row.alt_balls);
  validateBallKeys([row.recommended_ball, ...altBalls], ballCatalog, row.slug);

  return {
    dex: Number(row.dex),
    slug: row.slug,
    name: {
      ko: row.name_ko,
      en: row.name_en,
    },
    types: [row.primary_type, row.secondary_type].filter(Boolean),
    paletteTags: toList(row.palette_tags),
    recommendedBall: {
      key: row.recommended_ball,
      reason: row.recommended_ball_reason,
    },
    altBalls,
    designTags: toList(row.design_tags),
    obtainNote: row.obtain_note,
    legality: {
      status: normalizeLegalityStatus(row.legality_status),
      note: row.legality_note,
    },
    sourceNote: row.source_note,
  };
}

function buildSearchIndex(pokemon, ballCatalog) {
  return pokemon.map((item) => ({
    dex: item.dex,
    slug: item.slug,
    nameKo: item.name.ko,
    nameEn: item.name.en,
    types: item.types,
    recommendedBall: item.recommendedBall.key,
    recommendedBallNameKo: ballCatalog.get(item.recommendedBall.key)?.nameKo ?? item.recommendedBall.key,
    altBalls: item.altBalls,
    legalityStatus: item.legality.status,
    searchTokens: [
      String(item.dex),
      item.slug,
      item.name.ko,
      item.name.en,
      ...item.types,
      item.recommendedBall.key,
      ...item.altBalls,
      ...item.paletteTags,
      ...item.designTags,
    ],
  }));
}

function writeJson(targetPath, payload) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2) + '\n');
}

const csv = fs.readFileSync(sourcePath, 'utf8');
const rows = parseCsv(csv);
const ballCatalog = readBallCatalog();
const seen = new Set();
const pokemon = rows
  .map((row) => transformRow(row, ballCatalog))
  .filter(Boolean)
  .map((item) => {
    if (seen.has(item.slug)) {
      throw new Error(`Duplicate slug: ${item.slug}`);
    }
    seen.add(item.slug);
    return item;
  })
  .sort((a, b) => a.dex - b.dex || a.slug.localeCompare(b.slug));

const payload = {
  updatedAt: new Date().toISOString(),
  pokemon,
};

const searchIndex = {
  updatedAt: payload.updatedAt,
  pokemon: buildSearchIndex(pokemon, ballCatalog),
};

const ballCatalogPayload = {
  updatedAt: payload.updatedAt,
  balls: Array.from(ballCatalog.values()).sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key)),
};

writeJson(outputPath, payload);
writeJson(searchIndexPath, searchIndex);
writeJson(ballCatalogOutputPath, ballCatalogPayload);
writeJson(publicPath, payload);
writeJson(publicSearchIndexPath, searchIndex);
writeJson(publicBallCatalogPath, ballCatalogPayload);

console.log(`Wrote ${pokemon.length} entries to:`);
console.log(`- ${outputPath}`);
console.log(`- ${searchIndexPath}`);
console.log(`- ${ballCatalogOutputPath}`);
console.log(`- ${publicPath}`);
console.log(`- ${publicSearchIndexPath}`);
console.log(`- ${publicBallCatalogPath}`);
