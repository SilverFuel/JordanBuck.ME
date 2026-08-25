import { existsSync, readFileSync, statSync } from 'node:fs';

const resumeFilename = 'jordan-buck-resume.pdf';
const resumePath = new URL(`../public/${resumeFilename}`, import.meta.url);

if (!existsSync(resumePath) || statSync(resumePath).size === 0) {
  throw new Error(`/${resumeFilename} is missing or empty.`);
} else if (readFileSync(resumePath).subarray(0, 5).toString() !== '%PDF-') {
  throw new Error(`/${resumeFilename} is not a valid PDF file.`);
}
