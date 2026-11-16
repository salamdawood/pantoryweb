import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readStructuredData } from './validate-jsonld.mjs';
const require = createRequire(import.meta.url);
const urls = require('../site.config.js')();

const output = resolve('_site');
const prefix = urls.basePath;
const origin = urls.origin;
function decode(value) {
  return value.replace(/&(?:quot|amp|lt|gt|apos|#39|#x27);/g, entity => ({'&quot;':'"','&amp;':'&','&lt;':'<','&gt;':'>',"&apos;":"'",'&#39;':"'",'&#x27;':"'"})[entity]);
}
function textOf(value) { return decode(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function meta(html, key) {
  const match = [...html.matchAll(/<meta\b[^>]*>/gi)].find(([tag]) => tag.includes(`name="${key}"`) || tag.includes(`property="${key}"`));
  return match ? decode(match[0].match(/content="([^"]*)"/)?.[1] || '') : '';
}

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
for (const required of ['index.html', 'features/index.html', 'support/index.html', 'blog/index.html', 'privacy.html', 'terms.html']) {
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

const pageRecords = [];
const blogIndex = await readFile(resolve(output, 'blog/index.html'), 'utf8');
const hasPosts = !meta(blogIndex, 'robots').includes('noindex');
const titles = new Set();
const descriptions = new Set();
for (const [index, file] of pages.entries()) {
  const name = pageNames[index];
  const html = await readFile(file, 'utf8');
  if (!process.env.PANTORY_TEST_FIXTURES) assert(!name.includes('test-fixture/') && !html.includes('TEST FIXTURE'), `${name}: leftover test content`);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert(title && description, `${name}: missing metadata`);
  assert(!titles.has(title) && !descriptions.has(description), `${name}: metadata must be unique`);
  titles.add(title);
  descriptions.add(description);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${name}: expected one h1`);
  const structured = readStructuredData(html, name);
  assert(!html.includes('{{'), `${name}: unresolved template`);

  const publicPath = name.replace(/(^|\/)index\.html$/, '$1');
  const expectedURL = origin + prefix + publicPath;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const ogURL = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  assert.equal(canonical, expectedURL, `${name}: incorrect canonical URL`);
  assert.equal(ogURL, expectedURL, `${name}: incorrect Open Graph URL`);

  for (const route of ['features/', 'support/', 'privacy.html', 'terms.html']) {
    assert(html.includes(`href="${prefix}${route}"`), `${name}: missing shared route ${route}`);
  }
  assert(html.includes('https://apps.apple.com/us/app/pantry-inventory-pantory/id6772602868'), `${name}: missing App Store link`);
  const mainNav = html.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/)?.[1] || '';
  const footerNav = html.match(/<nav aria-label="Footer navigation">([\s\S]*?)<\/nav>/)?.[1] || '';
  for (const navigation of [mainNav, footerNav]) {
    assert.equal(navigation.includes(`href="${prefix}blog/"`), hasPosts, `${name}: Blog navigation does not match published content`);
  }
  if (['features/index.html', 'support/index.html'].includes(name) || (name === 'blog/index.html' && hasPosts)) {
    assert(mainNav.includes(`href="${prefix}${publicPath}" aria-current="page"`), `${name}: missing current page indicator`);
  }
  if (name === 'index.html') {
    const hero = html.match(/<section class="hero wrap"[\s\S]*?<\/section>/)?.[0] || '';
    assert(!hero.includes('class="cta-note"'), 'Homepage hero message must remain removed');
  }
  if (['support/index.html', 'terms.html'].includes(name)) {
    assert(html.includes('href="mailto:support@getpantory.com"'), `${name}: incorrect support email`);
  }
  assert(!html.includes('salamd135@gmail.com'), `${name}: obsolete support email`);
  const ogType = html.match(/<meta property="og:type" content="([^"]+)"/)?.[1];
  if (ogType === 'article') {
    assert(html.includes('<meta name="author" content="'), `${name}: missing article author`);
    for (const property of ['published_time']) {
      assert(html.includes(`property="article:${property}"`), `${name}: missing article ${property}`);
    }
    const published = html.match(/property="article:published_time" content="([^"]+)"/)?.[1];
    assert(!Number.isNaN(Date.parse(published)), `${name}: invalid publication date`);
  }

  assert.equal(meta(html, 'og:type'), name.includes('blog/') && name !== 'blog/index.html' ? 'article' : 'website', `${name}: incorrect Open Graph type`);
  assert.equal(meta(html, 'og:title'), decode(title), `${name}: Open Graph title mismatch`);
  assert.equal(meta(html, 'og:description'), decode(description), `${name}: Open Graph description mismatch`);
  const robots = meta(html, 'robots');
  if (name === 'blog/index.html') assert.equal(robots.includes('noindex'), !hasPosts);
  else assert(!robots.includes('noindex'), `${name}: unexpected noindex`);
  const levels = [...html.replace(/<script\b[\s\S]*?<\/script>/gi, '').matchAll(/<h([1-6])\b/gi)].map(match => Number(match[1]));
  for (let i = 1; i < levels.length; i++) assert(levels[i] <= levels[i - 1] + 1, `${name}: skipped heading level`);
  for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
    assert(/\balt="[^"]*"/.test(tag), `${name}: missing image alt`);
    assert(/\bwidth="[1-9]\d*"/.test(tag) && /\bheight="[1-9]\d*"/.test(tag), `${name}: missing intrinsic image dimensions`);
  }
  const social = meta(html, 'og:image');
  assert(social.startsWith(origin + prefix), `${name}: social image must use the canonical origin/base`);
  assert.equal(meta(html, 'twitter:card'), 'summary_large_image');
  assert.equal(meta(html, 'twitter:image'), social);
  assert(meta(html, 'og:image:alt') && meta(html, 'twitter:image:alt') === meta(html, 'og:image:alt'));
  assert.equal(meta(html, 'twitter:title'), decode(title));
  assert.equal(meta(html, 'twitter:description'), decode(description));
  const socialFile = await resolveTarget(new URL(social).pathname);
  const socialBytes = await readFile(socialFile);
  const width = Number(meta(html, 'og:image:width'));
  const height = Number(meta(html, 'og:image:height'));
  assert(width > 0 && height > 0, `${name}: missing social dimensions`);
  if (socialFile.endsWith('.png')) {
    assert.equal(socialBytes.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(socialBytes.readUInt32BE(16), width);
    assert.equal(socialBytes.readUInt32BE(20), height);
  }
  const visible = textOf(html.replace(/<head\b[\s\S]*?<\/head>/i, '').replace(/<script\b[\s\S]*?<\/script>/gi, ''));
  if (name === 'index.html') {
    assert.equal(structured.length, 1);
    const app = structured[0];
    assert.equal(app['@type'], 'SoftwareApplication');
    assert.equal(app['@id'], urls.urlFor('') + '#pantory');
    assert.equal(app.name, 'Pantory');
    assert.equal(app.url, canonical);
    assert.equal(app.installUrl, 'https://apps.apple.com/us/app/pantry-inventory-pantory/id6772602868');
    assert.equal(app.operatingSystem, 'iOS');
    assert.equal(app.availableOnDevice, 'iPhone');
    assert.equal(app.applicationCategory, 'Pantry inventory');
    assert(visible.includes(app.name) && visible.includes(app.description));
    await resolveTarget(new URL(app.image).pathname);
    for (const unsupported of ['offers', 'aggregateRating', 'review', 'softwareVersion', 'releaseNotes', 'publisher']) assert(!(unsupported in app));
  } else if (ogType === 'article') {
    assert.equal(structured.length, 1);
    const article = structured[0];
    assert.equal(article['@type'], 'BlogPosting');
    assert.equal(article.url, canonical);
    assert.equal(article['@id'], canonical + '#article');
    assert.equal(article.headline, decode(title));
    assert.equal(article.description, decode(description));
    assert.equal(article.author.name, meta(html, 'author'));
    assert(visible.includes(article.author.name));
    assert.equal(article.datePublished, meta(html, 'article:published_time'));
    assert.equal(article.dateModified || '', meta(html, 'article:modified_time'));
    assert.equal(article.about['@id'], urls.urlFor('') + '#pantory');
    assert(visible.includes(article.headline));
  } else assert.equal(structured.length, 0, `${name}: unexpected structured data`);
  pageRecords.push({ url: canonical, noindex: robots.includes('noindex'), modified: meta(html, 'article:modified_time'), article: ogType === 'article' });

  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  for (const [, srcset] of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of srcset.split(',')) {
      const parsed = candidate.trim().match(/^(\S+)(?:\s+(\d+w|\d*\.?\d+x))?$/);
      assert(parsed, `${name}: invalid srcset candidate ${candidate}`);
      links.push(parsed[1]);
    }
  }
  for (const value of links) {
    const link = decode(value);
    assert(!/^javascript:/i.test(link), `${name}: executable link`);
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
assert.equal(hasPosts, pageRecords.some(page => page.article), 'Blog visibility must match actual published articles');
const sitemap = await readFile(resolve(output, 'sitemap.xml'), 'utf8');
assert(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
assert(sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
assert(!/<(?:priority|changefreq)>/.test(sitemap));
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, entry]) => ({
  url: decode(entry.match(/<loc>([^<]+)<\/loc>/)?.[1] || ''),
  modified: entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || ''
}));
assert.deepEqual(entries.map(entry => entry.url).sort(), pageRecords.filter(page => !page.noindex).map(page => page.url).sort(), 'Sitemap must contain exactly indexable public HTML pages');
for (const entry of entries) {
  const record = pageRecords.find(page => page.url === entry.url);
  if (entry.modified) assert(!Number.isNaN(Date.parse(entry.modified)), 'Invalid sitemap lastmod');
  if (record.article) assert.equal(entry.modified, record.modified, 'Article lastmod must use a genuine updated date, never the build date');
  await resolveTarget(new URL(entry.url).pathname);
}
const robots = await readFile(resolve(output, 'robots.txt'), 'utf8');
assert.equal(robots.trim(), `User-agent: *\nAllow: /\nSitemap: ${urls.urlFor('sitemap.xml')}`);
console.log(`Passed: ${pages.length} pages; metadata, canonicals, conditional Blog navigation/indexability, sitemap/robots, JSON-LD, headings, links, intrinsic dimensions and image variants (${prefix}).`);
