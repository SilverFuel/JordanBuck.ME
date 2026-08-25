import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const anchors = [...html.matchAll(/\shref="#([^"]+)"/g)].map((match) => match[1]);
const missing = anchors.filter((anchor) => !ids.includes(anchor));
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const sectionJumps = [...html.matchAll(/\sdata-section-jump(?=[\s>])/g)].length;
const projectPanels = [...html.matchAll(/\sdata-project-panel(?=[\s>])/g)].length;
const ownershipPanels = [...html.matchAll(/\sdata-ownership-panel(?=[\s>])/g)].length;
const aboutBeats = [...html.matchAll(/\sclass="[^"]*\babout-beat\b[^"]*"/g)].length;
const requiredHooks = [
  'data-section-index',
  'data-section-menu',
  'data-section-toggle',
  'data-operations-console',
  'data-ownership-path',
  'data-ownership-tabs',
  'data-project-stage',
  'data-project-tabs',
];

if (missing.length > 0) {
  console.error(`Missing anchor targets: ${missing.join(', ')}`);
  process.exit(1);
}

if (duplicateIds.length > 0) {
  console.error(`Duplicate IDs: ${duplicateIds.join(', ')}`);
  process.exit(1);
}

if (sectionJumps !== 7) {
  console.error(`Expected 7 section navigation links, found ${sectionJumps}.`);
  process.exit(1);
}

if (projectPanels !== 5) {
  console.error(`Expected 5 project panels, found ${projectPanels}.`);
  process.exit(1);
}

if (ownershipPanels !== 4) {
  console.error(`Expected 4 ownership panels, found ${ownershipPanels}.`);
  process.exit(1);
}

if (aboutBeats !== 3 || !html.includes('class="incident-callout')) {
  console.error(`Expected 3 About beats and a Delivery Optimization incident callout, found ${aboutBeats} beats.`);
  process.exit(1);
}

const missingHooks = requiredHooks.filter((hook) => !html.includes(hook));

if (missingHooks.length > 0) {
  console.error(`Missing interaction hooks: ${missingHooks.join(', ')}`);
  process.exit(1);
}

console.log(`HTML checks passed for ${anchors.length} in-page links, ${sectionJumps} section links, ${projectPanels} project panels, ${ownershipPanels} ownership panels, and ${aboutBeats} About beats.`);
