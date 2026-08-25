import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const anchors = [...html.matchAll(/\shref="#([^"]+)"/g)].map((match) => match[1]);
const missing = anchors.filter((anchor) => !ids.includes(anchor));
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const sectionJumps = [...html.matchAll(/\sdata-section-jump(?=[\s>])/g)].length;
const projectPanels = [...html.matchAll(/\sdata-project-panel(?=[\s>])/g)].length;
const requiredHooks = [
  'data-section-index',
  'data-section-menu',
  'data-section-toggle',
  'data-operations-console',
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

const missingHooks = requiredHooks.filter((hook) => !html.includes(hook));

if (missingHooks.length > 0) {
  console.error(`Missing interaction hooks: ${missingHooks.join(', ')}`);
  process.exit(1);
}

console.log(`HTML checks passed for ${anchors.length} in-page links, ${sectionJumps} section links, and ${projectPanels} project panels.`);
