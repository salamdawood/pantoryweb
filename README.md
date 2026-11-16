# Pantory marketing website

Eleventy, HTML/Nunjucks, vanilla CSS, and no executable production JavaScript (JSON-LD metadata only). Requires Node.js 20 or newer. Eleventy is the only direct build dependency.

## Install and preview

```sh
npm ci
npm run dev
```

Open http://localhost:8080/pantoryweb/. Eleventy watches source changes and reloads the preview. Stop with Ctrl+C.

## Production build

```sh
npm run build
npm run check
git diff --check
```

The generated GitHub Pages artifact is `_site/`. The default path prefix is `/pantoryweb/`, with canonical URLs on `https://salamdawood.github.io`. The original `privacy.html` and `terms.html` URLs are generated from `src/privacy.njk` and `src/terms.njk`; their legal wording is preserved. This milestone does not configure or publish GitHub Pages. A later deployment must build and serve `_site/`, rather than the repository root.

For a future custom-domain build (only after migration review):

```sh
BASE_PATH=/ SITE_URL=https://getpantory.com npm run build
BASE_PATH=/ SITE_URL=https://getpantory.com npm run check
```

For a root-path local preview, use `BASE_PATH=/ SITE_URL=https://getpantory.com npm run dev` and open http://localhost:8080/. `BASE_PATH` controls local links and assets; `SITE_URL` is the canonical origin. Origin/base-path normalization is centralized in `site.config.js` and shared by templates, sitemap/robots generation, and validation. Custom-domain builds require both environment values explicitly; mismatched GitHub origin/root or custom-domain/project-path builds fail. Domain migration, DNS, hosting settings, and actual legacy redirects remain separate work.

## Images and replacement

- Homepage copy and image placement: `src/index.njk`.
- Shared layout, navigation, App Store CTA, and screenshot component: `src/_includes/`.
- Live screenshot paths, dimensions, alt text, responsive variants, source hashes, and crop coordinates: `src/_data/screenshots.json`.
- Icon metadata: `src/_data/artwork.json`.
- Supplied originals (unchanged): `src/assets/images/pantory-icon.png` and `src/assets/screenshots/{inventory.PNG,expiring.PNG,barcode-scanner.PNG}`. Preserve filename casing.
- Generated web assets: `src/assets/optimized/`. Only optimized assets, CSS, and the official download badge are copied into production; original PNGs stay in source.

To replace assets, put new originals at the same paths, inspect them, then run the generator with a Python interpreter that has Pillow and WebP support:

```sh
python3 scripts/optimize-images.py
npm run build
npm run check
```

Pillow is only an optional local authoring tool; it is not a Node dependency and is not required for normal builds. If needed, install it in a temporary environment:

```sh
python3 -m venv /tmp/pantory-image-tools
/tmp/pantory-image-tools/bin/pip install Pillow
/tmp/pantory-image-tools/bin/python scripts/optimize-images.py
```

The generator uses Lanczos resizing and quality-90 WebP for screenshots, and lossless WebP for the transparent icon. It creates 320/640/960px screenshot variants and 96/192/288px icon variants, plus ICO, 32px PNG favicon, and 180px touch icon. It refreshes both data files and prints exact byte sizes. For changed screenshot content or source names, update the `SPECS` in the generator, including alt text, sizes, and the Inventory detail crop. Current crop coordinates in original pixels are `(60, 1002, 1230, 1842)`: three complete product rows with quantities and location labels. Recheck this crop whenever Inventory changes. No retouching, recoloring, UI recreation, or camera-preview enhancement is applied.

The hero uses full Inventory, eagerly loaded with high fetch priority. The first feature uses only the separate Inventory detail crop; Expiring and scanner views remain full images and load lazily. The component uses actual dimensions, `srcset`, and `sizes`. Full screenshots stay upright inside CSS phone frames. The foreground hardware layer sits above the screenshot. Its rounded bezel, floating Dynamic Island, lens, earpiece, and side buttons follow the user's supplied frame reference. The screenshot retains its natural proportions; only blank display corners are rounded. The Inventory detail crop remains unframed. The icon's own shape, alpha, and shading are preserved.

### Image transfer sizes

Rounded decimal kB; a browser selects one responsive candidate per image.

| Asset | Original PNG | WebP at 320 / 640 / 960px |
| --- | ---: | ---: |
| Inventory, 1290×2796 | 1,184.3 kB | 21.6 / 52.0 / 87.4 kB |
| Inventory detail, cropped to 1170×840 | same Inventory source | 9.2 / 22.5 / 38.7 kB |
| Expiring, 1290×2796 | 1,166.0 kB | 22.9 / 54.4 / 92.9 kB |
| Scanner, 1290×2796 | 1,466.8 kB | 24.4 / 56.6 / 92.3 kB |
| Icon, 1024×1024 | 995.3 kB | 6.5 / 19.5 / 42.0 kB at 96 / 192 / 288px |

All four screenshot instances plus the icon total about 84.6 kB at the smallest variants, 205.0 kB at the middle variants, or 353.3 kB at the largest variants, excluding the badge and favicons. Lazy loading defers images below the fold. The scanner preview retains the blur in the original. Secondary screenshot labels are necessarily small at narrow viewport widths; inspect physical-device rendering before publishing. The default 1200×630 social preview is `src/assets/optimized/pantory-social.png` (about 70 kB), generated locally from the authentic icon. Regenerate it with `python3 scripts/create-social-image.py` using Pillow and an installed bold sans-serif font. It is not part of runtime or npm build dependencies.

The unmodified `src/assets/app-store-badge.svg` was downloaded from Apple's official marketing tools endpoint: https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/en-us. Usage reference: https://developer.apple.com/app-store/marketing/guidelines/. The footer includes the Apple trademark credit. No external fonts, analytics, or client libraries are loaded.

## Supporting pages and Markdown articles

Public supporting routes are `/features/`, `/support/`, and `/blog/`. The support address (`support@getpantory.com`) is centralized in `src/_data/site.js` and also supplies the Terms contact link. Legal URLs remain `/privacy.html` and `/terms.html`. Shared navigation indicates the current page, including the Blog section on articles. Pages work without JavaScript.

To create an article:

1. Copy `docs/post-template.md` to a new `.md` file in `src/posts/`.
2. Provide `title`, `description`, an explicit `date` (`YYYY-MM-DD`), `author`, a stable `/blog/your-slug/` permalink, and boolean `draft`. `updated` is optional, must not precede publication, and should only record a genuine content update; never set it to the build date. The default visible editorial author is Pantory. `authorType` defaults to Organization for the editorial brand; set `Person` when naming an individual. This does not assert a legal company identity. Quote YAML values containing punctuation, using single quotes around values with double quotes or ampersands.
3. Write the Markdown body starting with an introduction and H2 sections. The article layout provides the H1, author, publication/update dates, metadata, and restrained download CTA. Use descriptive links and relative paths or the existing `assetUrl` filter for internal links; keep researched sources with the prose.
4. Run `npm run dev`. Drafts (`draft: true`) are excluded from both preview and production output and from the blog index. To inspect an unpublished draft locally, temporarily set `draft: false`, review in the local preview, and restore `true` afterward.
5. To include an approved article in the generated site, set `draft: false`, confirm the publication date and permanent URL, then run `npm run build` and `npm run check`. Publishing the generated `_site/` artifact through hosting remains a separate action; no hosting workflow is added here.

The blog index sorts published posts newest first. Dates display in UTC to avoid timezone shifts. Every build, including development rebuilds, cleans the generated `_site/` directory so previously published posts changed to drafts cannot linger. Do not store hand-edited source files in `_site/`.

Run `npm run check:blog` for isolated checks of Markdown rendering, nested permalinks, quoted/ampersand metadata, optional updated dates, ordering, and draft exclusion (including changing a published post back to draft). It copies source, configuration, and the output checker into a temporary project, reuses installed dependencies via a `node_modules` symlink, and builds both base paths there. All fixture files, build cleanup, and generated output stay in that temporary project, which is removed on success or failure. The live `src/posts/` and `_site/` are untouched, so `npm run dev` can remain running. No capture flag is needed or supported; the tests retain no temporary articles or review output.

For the normal production checks, run `npm run build`, `npm run check`, and `git diff --check`. Production builds still clean and write the real `_site/`; only the blog fixture tests are isolated.

The first planned article is **“How to Keep Track of What’s in Your Freezer”**, with future permalink `/blog/freezer-inventory/`. It is documented only in `docs/blog-plan.md`; no article or public page exists yet. The final blog index currently shows an honest empty state. Analytics and publication/deployment actions remain deferred. Technical SEO generation is described below.

## Review evidence

See `review/` for a small desktop/mobile screenshot set and validation notes. The current technical SEO audit is recorded in [review/launch-readiness.md](review/launch-readiness.md), with automated accessibility results in `review/launch-audit.json`. The supplied icon and screenshots are integrated. The default social preview is included. The output checker discovers HTML recursively, requires the homepage and legacy legal pages, validates directory-index links and canonical metadata, and allows future pages.

## Technical SEO and launch handoff

`site.config.js` is the single source for normalized origin/base-path handling. Always pass matching values to **both** build and checker:

```sh
# Existing GitHub Pages target
SITE_URL=https://salamdawood.github.io BASE_PATH=/pantoryweb/ npm run build
SITE_URL=https://salamdawood.github.io BASE_PATH=/pantoryweb/ npm run check

# Future custom-domain target, only after deployment planning review
SITE_URL=https://getpantory.com BASE_PATH=/ npm run build
SITE_URL=https://getpantory.com BASE_PATH=/ npm run check

# Isolated fixture checks exercise both targets without touching the live preview
npm run check:blog
git diff --check
```

After checking both targets, restore the existing GitHub Pages build before using the default local preview. Do not run a production build against the same `_site/` while the development server is rebuilding; fixture checks remain isolated and may run alongside it.

The sitemap is generated from indexable HTML page data, including published posts. It excludes drafts and non-page assets. Only an explicit, genuine `updated` date produces `lastmod`; no filesystem/build timestamp is used. The empty blog is `noindex`, hidden from shared navigation, and absent from the sitemap; all three automatically reverse when a published article exists. Drafts remain absent from output, independently of robots rules.

`robots.txt` allows public crawling and points to the absolute sitemap for the selected target. Crawlers read robots rules at the **hostname root**: `/pantoryweb/robots.txt` does not govern the `github.io` hostname. The future root deployment will place the generated file at `/robots.txt`. See [Google's robots documentation](https://developers.google.com/search/docs/crawling-indexing/robots/intro).

The homepage emits minimal SoftwareApplication JSON-LD; published articles emit BlogPosting. Pantory's application identity uses the canonical homepage plus `#pantory`. There are no ratings, offers, invented company details, minimum OS requirements, or FAQ markup. The script serializer escapes HTML-sensitive characters and Unicode line separators; validation accepts only parsed `application/ld+json` blocks and rejects executable scripts/malformed JSON. Structured data is not a promise of rich results or inclusion in AI search.

All pages use the default social image and Twitter `summary_large_image` metadata, including absolute image URLs, dimensions, and alt text. An article can override it with a local image copied to `assets/optimized/` and this front matter:

```yaml
socialImage:
  src: assets/optimized/article-social.png
  width: 1200
  height: 630
  alt: 'An accurate description of the article image'
```

Keep the supplied icon and screenshots unchanged. Regenerate the social PNG if the icon or headline changes, inspect it at small sizes, then rebuild. The output checker validates social PNG dimensions and all responsive-image candidates.

See [docs/launch-checklist.md](docs/launch-checklist.md) for hosting inspection, domain/HTTPS decisions, legacy URL verification, rollback, Search Console, and remaining user-operated checks. No workflow, CNAME, DNS record, token, or hosting setting is created by this milestone.
