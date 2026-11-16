import assert from 'node:assert/strict';
import { writeFile, readFile, rm, access, cp, mkdtemp, mkdir, symlink } from 'node:fs/promises';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';

const run = promisify(execFile);
const repository = fileURLToPath(new URL('../', import.meta.url));
const cli = join(repository, 'node_modules/@11ty/eleventy/cmd.cjs');
if (process.argv.length > 2) throw new Error('check:blog accepts no flags; all fixture projects are removed.');
const project = await mkdtemp(join(tmpdir(), 'pantory-blog-check-'));
const inProject = path => join(project, path);
console.log(`Isolated blog fixture project: ${project}`);
const fixtures = [
  {
    file: 'src/posts/milestone-test-newer.md',
    body: `---
title: 'TEST FIXTURE: Pantry "checks" & examples'
description: 'A "quoted" description & an ampersand; test content only. </script><script>alert("fixture")</script>'
date: 2026-11-12
updated: 2026-11-13
author: 'Pantory "Test" & Team'
permalink: /blog/test-fixture/newer/
draft: false
---

This is **temporary layout test content**, not a researched Pantory article.

## A readable section

This paragraph checks the article’s reading width, spacing, and links. Visit [Pantory’s features]({{ 'features/' | assetUrl }}#inventory) for real product information.

- First test point, with enough text to wrap naturally on a narrow screen.
- Second test point for checking list spacing.

### A subsection

> This quotation is test content for the article layout.

## Another section

The publication date, updated date, author, and download action should remain clear on desktop and mobile.
`
  },
  {
    file: 'src/posts/milestone-test-older.md',
    body: `---
title: Older test fixture
description: Temporary older article for sorting validation.
date: 2026-11-01
author: Pantory Test
permalink: /blog/test-fixture/older/
draft: false
socialImage:
  src: assets/optimized/test-social.png
  width: 1200
  height: 630
  alt: 'Test image with "quotes" & an ampersand' 
---

Temporary sorting fixture.
`
  },
  {
    file: 'src/posts/milestone-test-draft.md',
    body: `---
title: DRAFT FIXTURE NEVER PUBLIC
description: Temporary draft exclusion test.
date: 2026-11-14
author: Pantory Test
permalink: /blog/test-fixture/draft/
draft: true
---

This draft must never appear in public output or the blog index.
`
  }
];
async function build(env) {
  await run(process.execPath, [cli], { cwd: project, env, maxBuffer: 1024 * 1024 });
  await run(process.execPath, ['scripts/check-output.mjs'], { cwd: project, env });
}
async function absent(path) {
  await assert.rejects(access(inProject(path)), `${path} should not exist`);
}

try {
  // Configuration, source and the checker resolve relative to this copy only.
  // A directory symlink reuses installed packages; node_modules is never copied.
  await cp(join(repository, 'src'), inProject('src'), { recursive: true });
  for (const name of ['eleventy.config.js', 'site.config.js', 'package.json']) {
    await cp(join(repository, name), inProject(name));
  }
  await cp(join(repository, 'lib'), inProject('lib'), { recursive: true });
  await mkdir(inProject('scripts'));
  for (const name of ['check-output.mjs', 'validate-jsonld.mjs']) await cp(join(repository, 'scripts', name), inProject('scripts/' + name));
  await symlink(join(repository, 'node_modules'), inProject('node_modules'), 'dir');

  const require = createRequire(import.meta.url);
  const config = require(inProject('site.config.js'));
  assert.equal(config({SITE_URL: ' https://getpantory.com/// ', BASE_PATH: '//'}).urlFor('/features/'), 'https://getpantory.com/features/');
  assert.equal(config({SITE_URL: 'https://salamdawood.github.io/', BASE_PATH: 'pantoryweb//'}).basePath, '/pantoryweb/');
  assert.throws(() => config({SITE_URL: 'https://getpantory.com'}));
  assert.throws(() => config({SITE_URL: 'https://salamdawood.github.io', BASE_PATH: '/'}));
  assert.throws(() => config({SITE_URL: 'https://getpantory.com/path', BASE_PATH: '/'}));
  for (const [base, origin] of [['/pantoryweb/', 'https://salamdawood.github.io'], ['/', 'https://getpantory.com']]) {
    const env = { ...process.env, BASE_PATH: base, SITE_URL: origin, PANTORY_TEST_FIXTURES: '1' };
    await build(env);
    let emptyBlog = await readFile(inProject('_site/blog/index.html'), 'utf8');
    let emptyHome = await readFile(inProject('_site/index.html'), 'utf8');
    assert(emptyBlog.includes('content="noindex, follow"'));
    assert(!emptyHome.includes(`href="${base}blog/"`));
    assert(!(await readFile(inProject('_site/sitemap.xml'), 'utf8')).includes(origin + base + 'blog/'));
    await cp(inProject('src/assets/optimized/pantory-social.png'), inProject('src/assets/optimized/test-social.png'));
    for (const fixture of fixtures) await writeFile(inProject(fixture.file), fixture.body, { flag: 'wx' });
    await build(env);
    const article = await readFile(inProject('_site/blog/test-fixture/newer/index.html'), 'utf8');
    const older = await readFile(inProject('_site/blog/test-fixture/older/index.html'), 'utf8');
    const index = await readFile(inProject('_site/blog/index.html'), 'utf8');
    assert(article.includes('<title>TEST FIXTURE: Pantry &quot;checks&quot; &amp; examples</title>'));
    assert(article.includes('content="A &quot;quoted&quot; description &amp; an ampersand; test content only. &lt;/script&gt;&lt;script&gt;alert(&quot;fixture&quot;)&lt;/script&gt;"'));
    assert(article.includes('content="Pantory &quot;Test&quot; &amp; Team"'));
    assert(article.includes('property="og:type" content="article"'));
    assert(article.includes('property="article:published_time" content="2026-11-12T00:00:00.000Z"'));
    assert(article.includes('property="article:modified_time" content="2026-11-13T00:00:00.000Z"'));
    assert(!older.includes('article:modified_time'));
    const ld = JSON.parse(article.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(ld.headline, 'TEST FIXTURE: Pantry "checks" & examples');
    assert.equal(ld.author.name, 'Pantory "Test" & Team');
    assert(ld.description.includes('</script><script>alert("fixture")</script>'));
    assert(article.includes('\\u003c/script\\u003e'));
    assert(older.includes(`content="${origin}${base}assets/optimized/test-social.png"`));
    assert(older.includes('Test image with &quot;quotes&quot; &amp; an ampersand'));
    const sitemap = await readFile(inProject('_site/sitemap.xml'), 'utf8');
    assert(sitemap.includes(`${origin}${base}blog/test-fixture/newer/`));
    assert(sitemap.includes(`${origin}${base}blog/test-fixture/older/`));
    assert(sitemap.includes(`<loc>${origin}${base}blog/</loc>`));
    assert(sitemap.includes('<lastmod>2026-11-13T00:00:00.000Z</lastmod>'));
    assert(!sitemap.includes('test-fixture/draft/'));
    assert(!index.includes('content="noindex'));
    assert((await readFile(inProject('_site/index.html'), 'utf8')).includes(`href="${base}blog/"`));
    for (const mutation of [
      article.replace(/(<script type="application\/ld\+json">)[\s\S]*?(<\/script>)/, '$1{broken JSON$2'),
      article + '<script>alert("unexpected")</script>'
    ]) {
      await writeFile(inProject('_site/blog/test-fixture/newer/index.html'), mutation);
      await assert.rejects(run(process.execPath, ['scripts/check-output.mjs'], {cwd: project, env}));
    }
    await writeFile(inProject('_site/blog/test-fixture/newer/index.html'), article);
    assert(article.includes('<h2>A readable section</h2>') && article.includes('<strong>temporary layout test content</strong>'));
    assert(article.includes('aria-current="location"'));
    const newerLink = `href="${base}blog/test-fixture/newer/"`;
    const olderLink = `href="${base}blog/test-fixture/older/"`;
    assert(index.indexOf(newerLink) >= 0 && index.indexOf(newerLink) < index.indexOf(olderLink));
    assert(!index.includes('DRAFT FIXTURE NEVER PUBLIC'));
    await absent('_site/blog/test-fixture/draft/index.html');
    await absent('_site/docs/post-template/index.html');

    // Publishing a post and subsequently marking it draft must also remove stale output.
    await writeFile(inProject(fixtures[2].file), fixtures[2].body.replace('draft: true', 'draft: false'));
    await build(env);
    await access(inProject('_site/blog/test-fixture/draft/index.html'));
    await writeFile(inProject(fixtures[2].file), fixtures[2].body);
    await build(env);
    await absent('_site/blog/test-fixture/draft/index.html');
    assert(!(await readFile(inProject('_site/blog/index.html'), 'utf8')).includes('DRAFT FIXTURE NEVER PUBLIC'));

    for (const fixture of fixtures) await rm(inProject(fixture.file));
    await rm(inProject('src/assets/optimized/test-social.png'));
    await build(env);
    emptyBlog = await readFile(inProject('_site/blog/index.html'), 'utf8');
    emptyHome = await readFile(inProject('_site/index.html'), 'utf8');
    assert(emptyBlog.includes('content="noindex, follow"'));
    assert(!emptyHome.includes(`href="${base}blog/"`));
    assert(!(await readFile(inProject('_site/sitemap.xml'), 'utf8')).includes(origin + base + 'blog/'));
    console.log(`Blog fixtures passed: ${base} — Markdown, nested permalink, escaped metadata, article dates, sorting, and draft removal.`);
  }
  // Verify the fixture-free output inside the temporary project as well.
  await build(process.env);
  await absent('_site/blog/test-fixture');
  assert(!(await readFile(inProject('_site/blog/index.html'), 'utf8')).includes('TEST FIXTURE:'));
  console.log('Temporary output is fixture-free; live source and output were not rebuilt.');
} finally {
  // This removes the dependency symlink itself, never the installed packages.
  await rm(project, { recursive: true, force: true });
  console.log('Removed isolated blog fixture project.');
}
