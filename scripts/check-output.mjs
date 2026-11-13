import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import assert from 'node:assert/strict';

const output = resolve('_site');
const base = '/' + (process.env.BASE_PATH || '/pantoryweb/').split('/').filter(Boolean).join('/');
const prefix = base === '/' ? '/' : base + '/';
const origin = (process.env.SITE_URL || 'https://salamdawood.github.io').replace(/\/$/, '');

async function discoverHTML(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return discoverHTML(path);
    return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
  }));
  return nested.flat();
}

const pages = await discoverHTML(output);
const pageNames = pages.map(path => relative(output, path).split(sep).join('/'));
for (const required of ['index.html', 'privacy.html', 'terms.html']) {
  assert(pageNames.includes(required), `Missing required output: ${required}`);
}

async function resolveTarget(pathname) {
  assert(pathname.startsWith(prefix), `Link escapes configured base: ${pathname}`);
  const target = resolve(output, decodeURIComponent(pathname.slice(prefix.length)));
  assert(target === output || target.startsWith(output + sep), `Link escapes output: ${pathname}`);
  const info = await stat(target);
  const file = info.isDirectory() ? resolve(target, 'index.html') : target;
  assert((await stat(file)).isFile(), `Missing target: ${pathname}`);
  return file;
}

const titles = new Set();
const descriptions = new Set();
for (const [index, file] of pages.entries()) {
  const name = pageNames[index];
  const html = await readFile(file, 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert(title && description, `${name}: missing metadata`);
  assert(!titles.has(title) && !descriptions.has(description), `${name}: metadata must be unique`);
  titles.add(title);
  descriptions.add(description);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${name}: expected one h1`);
  assert(!html.includes('<script'), `${name}: unexpected production script`);
  assert(!html.includes('{{'), `${name}: unresolved template`);

  const publicPath = name.replace(/(^|\/)index\.html$/, '$1');
  const expectedURL = origin + prefix + publicPath;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const ogURL = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  assert.equal(canonical, expectedURL, `${name}: incorrect canonical URL`);
  assert.equal(ogURL, expectedURL, `${name}: incorrect Open Graph URL`);

  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  for (const [, srcset] of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of srcset.split(',')) {
      const parsed = candidate.trim().match(/^(\S+)(?:\s+(\d+w|\d*\.?\d+x))?$/);
      assert(parsed, `${name}: invalid srcset candidate ${candidate}`);
      links.push(parsed[1]);
    }
  }
  for (const value of links) {
    const link = value.replaceAll('&amp;', '&');
    const url = new URL(link, `https://local.test${prefix}${publicPath}`);
    if (url.origin !== 'https://local.test') continue;
    const target = await resolveTarget(url.pathname);
    if (url.hash) {
      const targetHTML = await readFile(target, 'utf8');
      const fragment = decodeURIComponent(url.hash.slice(1));
      assert(targetHTML.includes(`id="${fragment}"`), `${name}: missing anchor ${link}`);
    }
  }
}
console.log(`Passed: ${pages.length} HTML pages, required legacy output, unique metadata, canonicals, headings, internal assets/srcset/links/anchors, and zero production scripts (${prefix}).`);
