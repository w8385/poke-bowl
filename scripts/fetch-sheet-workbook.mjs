import fs from 'node:fs';
import path from 'node:path';

const SHEET_ID = '1bvIx7Q2Lxp7efHRrUh48WkuwirNlKardwSHVz_R8kA0';
const EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;
const root = path.resolve(import.meta.dirname, '..');
const outputPath = path.join(root, 'data/source/legal-matching-pokeballs.xlsx');

const response = await fetch(EXPORT_URL);
if (!response.ok) {
  throw new Error(`Failed to fetch workbook: ${response.status} ${response.statusText}`);
}

const buffer = Buffer.from(await response.arrayBuffer());
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buffer);

console.log(`Saved workbook to ${outputPath}`);
