import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const anchors = [...html.matchAll(/\shref="#([^"]+)"/g)].map((match) => match[1]);
const missing = anchors.filter((anchor) => !ids.includes(anchor));

if (missing.length > 0) {
  console.error(`Missing anchor targets: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`HTML anchor check passed for ${anchors.length} in-page links.`);
