import { existsSync, statSync } from 'node:fs';

const resumeFilename = 'Jordan_Buck_One_Page_Enterprise_Technology_Resume.docx';
const resumePath = new URL(`../public/${resumeFilename}`, import.meta.url);

if (!existsSync(resumePath) || statSync(resumePath).size === 0) {
  console.warn(`Build warning: /${resumeFilename} is missing or empty.`);
}
