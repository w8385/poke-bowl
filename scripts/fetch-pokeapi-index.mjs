import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const generatedPath = path.join(root, 'data/generated/pokemon-index.json');
const publicPath = path.join(root, 'client/public/data/pokemon-index.json');

async function fetchCsv(name) {
  const url = `https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/${name}.csv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function writeJson(targetPath, payload) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2) + '\n');
}

const [speciesCsv, speciesNamesCsv, pokemonCsv, pokemonTypesCsv, typeNamesCsv] = await Promise.all([
  fetchCsv('pokemon_species'),
  fetchCsv('pokemon_species_names'),
  fetchCsv('pokemon'),
  fetchCsv('pokemon_types'),
  fetchCsv('type_names'),
]);

const species = parseCsv(speciesCsv);
const speciesNames = parseCsv(speciesNamesCsv);
const pokemon = parseCsv(pokemonCsv);
const pokemonTypes = parseCsv(pokemonTypesCsv);
const typeNames = parseCsv(typeNamesCsv);

const koNames = new Map();
const enNames = new Map();
for (const row of speciesNames) {
  if (row.local_language_id === '3') koNames.set(row.pokemon_species_id, row.name);
  if (row.local_language_id === '9') enNames.set(row.pokemon_species_id, row.name);
}

const typeNameMap = new Map();
for (const row of typeNames) {
  if (row.local_language_id === '3') {
    typeNameMap.set(row.type_id, row.name);
  }
}

const defaultPokemonIds = new Map();
for (const row of pokemon) {
  if (row.is_default === '1') {
    defaultPokemonIds.set(row.species_id, row.id);
  }
}

const pokemonTypeMap = new Map();
for (const row of pokemonTypes) {
  const arr = pokemonTypeMap.get(row.pokemon_id) ?? [];
  arr.push({ slot: Number(row.slot), typeId: row.type_id });
  pokemonTypeMap.set(row.pokemon_id, arr);
}

const entries = species
  .filter((row) => defaultPokemonIds.has(row.id))
  .map((row) => {
    const pokemonId = defaultPokemonIds.get(row.id);
    const typeRows = (pokemonTypeMap.get(pokemonId) ?? []).sort((a, b) => a.slot - b.slot);
    return {
      dex: Number(row.id),
      slug: row.identifier,
      name: {
        ko: koNames.get(row.id) ?? '',
        en: enNames.get(row.id) ?? row.identifier,
      },
      generation: Number(row.generation_id),
      types: typeRows.map((item) => typeNameMap.get(item.typeId) ?? item.typeId),
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
      genderRate: Number(row.gender_rate),
      isLegendary: row.is_legendary === '1',
      isMythical: row.is_mythical === '1',
    };
  })
  .sort((a, b) => a.dex - b.dex);

const payload = {
  updatedAt: new Date().toISOString(),
  count: entries.length,
  pokemon: entries,
};

writeJson(generatedPath, payload);
writeJson(publicPath, payload);

console.log(`Wrote ${entries.length} pokemon to:`);
console.log(`- ${generatedPath}`);
console.log(`- ${publicPath}`);
