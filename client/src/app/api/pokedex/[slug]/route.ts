import { NextResponse } from 'next/server';

import { getPokemonList } from '@/lib/ball-data';

type Params = { params: Promise<{ slug: string }> };

type PokeApiSpecies = {
  genera: Array<{ genus: string; language: { name: string } }>;
  flavor_text_entries: Array<{ flavor_text: string; language: { name: string } }>;
  habitat: { name: string } | null;
  shape: { name: string } | null;
  capture_rate: number;
};

type PokeApiPokemon = {
  height: number;
  weight: number;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
};

function pickText<T extends { language: { name: string } }>(entries: T[], field: keyof T) {
  const preferred = ['ko', 'ja-Hrkt', 'ja', 'en'];
  for (const lang of preferred) {
    const found = entries.find((entry) => entry.language.name === lang);
    if (found) return String(found[field] ?? '');
  }
  return entries[0] ? String(entries[0][field] ?? '') : undefined;
}

function cleanText(text?: string) {
  return text?.replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
}

function titleize(value?: string | null) {
  if (!value) return null;
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const pokemon = getPokemonList().find((item) => item.slug === slug);
  if (!pokemon) {
    return NextResponse.json({ error: 'pokemon not found' }, { status: 404 });
  }

  const [speciesResponse, pokemonResponse] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${slug}`, { next: { revalidate: 86400 } }),
    fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`, { next: { revalidate: 86400 } }),
  ]);

  if (!speciesResponse.ok || !pokemonResponse.ok) {
    return NextResponse.json({ error: 'pokedex fetch failed' }, { status: 502 });
  }

  const species = (await speciesResponse.json()) as PokeApiSpecies;
  const pokemonData = (await pokemonResponse.json()) as PokeApiPokemon;

  const genus = cleanText(pickText(species.genera, 'genus'));
  const flavorText = cleanText(pickText(species.flavor_text_entries, 'flavor_text'));

  return NextResponse.json({
    slug,
    genus,
    flavorText,
    habitat: titleize(species.habitat?.name ?? null),
    shape: titleize(species.shape?.name ?? null),
    captureRate: species.capture_rate,
    heightM: pokemonData.height / 10,
    weightKg: pokemonData.weight / 10,
    abilities: pokemonData.abilities.map((entry) => ({
      name: titleize(entry.ability.name) ?? entry.ability.name,
      hidden: entry.is_hidden,
    })),
  });
}
