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
const operationModes = [...html.matchAll(/\sdata-operations-mode="[^"]+"/g)].length;
const skillLanes = [...html.matchAll(/\sclass="[^"]*\bskill-lane\b[^"]*"/g)].length;
const requiredMetricPatterns = [
  /data-operations-value>20<\/strong>/,
  /data-operations-mode="software">\s*<strong>2,700<\/strong><span>Software titles<\/span>/,
  /data-operations-mode="endpoints">\s*<strong>38,000\+<\/strong><span>Endpoints<\/span>/,
  /data-operations-mode="team">\s*<strong>20<\/strong><span>People<\/span>/,
];
const scaleMetricCounts = {
  software: [...html.matchAll(/2,700/g)].length,
  endpoints: [...html.matchAll(/38,000\+/g)].length,
};
const requiredHooks = [
  'data-section-index',
  'data-section-menu',
  'data-section-toggle',
  'data-operations-console',
  'data-ownership-path',
  'data-ownership-tabs',
  'data-project-stage',
  'data-project-tabs',
  'data-image-preview',
  'data-image-viewer',
  'data-image-zoom',
  'id="missionboard-live"',
  'title="MissionBoard live demo — fictional read-only workspace"',
];

if (missing.length > 0) {
  console.error(`Missing anchor targets: ${missing.join(', ')}`);
  process.exit(1);
}

if (duplicateIds.length > 0) {
  console.error(`Duplicate IDs: ${duplicateIds.join(', ')}`);
  process.exit(1);
}

if (sectionJumps !== 5 || html.includes('id="impact"') || html.includes('id="skills"')) {
  console.error(`Expected 5 section navigation links and no duplicate Impact or Skills section, found ${sectionJumps} links.`);
  process.exit(1);
}

if (projectPanels !== 4 || !html.includes('class="mission-case-study')) {
  console.error(`Expected a MissionBoard case study and 4 after-hours project panels, found ${projectPanels} panels.`);
  process.exit(1);
}

if (ownershipPanels !== 4) {
  console.error(`Expected 4 ownership panels, found ${ownershipPanels}.`);
  process.exit(1);
}

if (aboutBeats !== 4 || !html.includes('class="incident-callout')) {
  console.error(`Expected 4 About beats and a Delivery Optimization incident callout, found ${aboutBeats} beats.`);
  process.exit(1);
}

if (
  operationModes !== 3
  || html.includes('2,700+')
  || scaleMetricCounts.software !== 1
  || scaleMetricCounts.endpoints !== 2
  || requiredMetricPatterns.some((pattern) => !pattern.test(html))
) {
  console.error(`Expected consolidated operational scope metrics, found ${operationModes} modes, ${scaleMetricCounts.software} software values, and ${scaleMetricCounts.endpoints} endpoint values.`);
  process.exit(1);
}

if (skillLanes !== 0 || !html.includes('class="homeos-visual__health')) {
  console.error(`Expected the redundant Skills section removed and the enhanced HomeOS visual retained, found ${skillLanes} skill lanes.`);
  process.exit(1);
}

const positioningSignals = [
  'ENTERPRISE TECHNOLOGY LEADERSHIP',
  '5+ stores',
  '300+ reviews',
  'more than $3.5M in revenue',
  'jordan@jordanbuck.me',
  'href="/jordan-buck-resume.pdf"',
];

const complianceComparison = /class="ownership-result__comparison"><span>82\.32%<\/span>\s*<span[^>]*>to<\/span>\s*<strong>99\.19%<\/strong>/;
if (!complianceComparison.test(html) || !html.includes('Built a statewide update-compliance program')) {
  console.error('The measured compliance comparison or update-program context is missing.');
  process.exit(1);
}

if (
  positioningSignals.some((signal) => !html.includes(signal))
  || html.includes('spot bonuses')
  || html.includes('Ollama and Local Models')
) {
  console.error('Executive positioning proof, domain email, or PDF resume link is missing or stale copy remains.');
  process.exit(1);
}

const missingHooks = requiredHooks.filter((hook) => !html.includes(hook));

if (missingHooks.length > 0) {
  console.error(`Missing interaction hooks: ${missingHooks.join(', ')}`);
  process.exit(1);
}

console.log(`HTML checks passed for ${anchors.length} in-page links, ${sectionJumps} section links, 1 MissionBoard case study, ${projectPanels} after-hours project panels, ${ownershipPanels} ownership panels, ${aboutBeats} leadership beats, and ${operationModes} scope modes.`);
