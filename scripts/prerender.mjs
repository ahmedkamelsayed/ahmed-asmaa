// Injects the server-rendered invitation into each built page so the
// content is visible without JavaScript and readable by link-preview crawlers.
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ssrDir = path.join(root, 'dist-ssr');
const { render } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);

for (const [file, lang] of [['index.html', 'ar'], ['en.html', 'en']]) {
  const htmlFile = path.join(root, 'dist', file);
  const html = await readFile(htmlFile, 'utf8');
  if (!html.includes('<!--app-html-->')) throw new Error(`Placeholder <!--app-html--> not found in dist/${file}`);
  await writeFile(htmlFile, html.replace('<!--app-html-->', render(lang)));
  console.log(`Prerendered dist/${file} (${lang})`);
}
await rm(ssrDir, { recursive: true, force: true });
