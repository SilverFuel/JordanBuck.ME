import { existsSync, statSync } from 'node:fs';

const resumePath = new URL('../public/jordan-buck-resume.pdf', import.meta.url);

if (!existsSync(resumePath) || statSync(resumePath).size === 0) {
  console.warn('Build warning: /jordan-buck-resume.pdf is missing or empty.');
}
