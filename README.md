# Pantory marketing website

Eleventy, HTML/Nunjucks, vanilla CSS, and no production JavaScript. Requires Node.js 20 or newer. Eleventy is the only direct build dependency.

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
BASE_PATH=/ npm run check
```

For a root-path local preview, use `BASE_PATH=/ npm run dev` and open http://localhost:8080/. `BASE_PATH` controls local links and assets; `SITE_URL` is the canonical origin. The current default origin lives in `src/_data/site.js`. Domain migration, DNS, hosting settings, and actual legacy redirects remain separate work.

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

All four screenshot instances plus the icon total about 84.6 kB at the smallest variants, 205.0 kB at the middle variants, or 353.3 kB at the largest variants, excluding the badge and favicons. Lazy loading defers images below the fold. The scanner preview retains the blur in the original. Secondary screenshot labels are necessarily small at narrow viewport widths; inspect physical-device rendering before publishing. A dedicated social preview image remains deferred.

The unmodified `src/assets/app-store-badge.svg` was downloaded from Apple's official marketing tools endpoint: https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/en-us. Usage reference: https://developer.apple.com/app-store/marketing/guidelines/. The footer includes the Apple trademark credit. No external fonts, analytics, or client libraries are loaded.

## Supporting pages and future blog

Add supporting Nunjucks or Markdown pages under `src/` with `layout: layouts/base.njk`, a unique `title`, and `description` in front matter. Markdown is enabled; no Features or Blog pages, navigation links, or articles are included yet.

## Review evidence

See `review/` for a small desktop/mobile screenshot set and validation notes. The supplied icon and screenshots are integrated. Only social preview artwork remains deferred. The output checker discovers HTML recursively, requires the homepage and legacy legal pages, validates directory-index links and canonical metadata, and allows future pages.
