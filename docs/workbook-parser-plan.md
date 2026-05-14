# Workbook Parser Plan

## Source
- Google Sheet / workbook: `Legal Matching Pokéballs 2.1`
- Local mirror: `data/source/legal-matching-pokeballs.xlsx`

## Confirmed workbook structure
- Sheets
  - `Intro`
  - `Gen 1` ~ `Gen 9`
  - `Vivillon`
  - `Alcremie`
- Main generation sheets are not flat tables.
- They are laid out as a board:
  - top row contains repeated `dex + English name`
  - following rows contain recommendation cells under each Pokémon block
- `Intro` sheet contains the ball key legend.

## Observed pattern
Example from `Gen 1`
- row 1: `0001 Bulbasaur 0002 Ivysaur ...`
- rows 2~7: recommendation area under those Pokémon columns
- next Pokémon row starts again at row 8

This implies the parser should treat the workbook as:
- a repeated vertical block per Pokémon row band
- likely `dex cell + name cell + stacked recommendation rows`

## Parsing direction
1. Read workbook sheets directly from the xlsx zip
2. Build sheet cell map (`ref -> value/style`)
3. Detect Pokémon anchors from 4-digit dex cells
4. For each anchor, inspect the rows immediately below that anchor block
5. Convert those recommendation cells into:
   - `recommendedBall`
   - `altBalls[]`
6. Merge with local slug/name mapping from PokeAPI index

## Practical next step
- write a lightweight parser script dedicated to:
  - extracting anchor positions
  - dumping one normalized JSON preview for a single generation
- after preview quality is good, connect it to `build-ball-data.mjs`

## Notes
- current site no longer exposes legality messaging in UI
- workbook is now used as the primary recommendation source target
