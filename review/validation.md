# Authentic asset integration review

Validated November 13, 2026. The four current captures replace the previous neutral-slot design.

## Product presentation

- The supplied transparent Pantory icon appears at 72px desktop / 64px mobile, without an added mask, background tile, or shadow. Favicons and a touch icon derive from the same source.
- Full Light Mode Inventory is centered below the hero CTA inside a 320px desktop / up to 280px mobile phone frame, with a restrained shadow. All original controls remain visible in the full image.
- The first feature uses a separate three-row Inventory crop, not a repeated full screenshot. The crop includes quantities, Home/Fridge labels, and quantity controls without altering UI.
- Full Dark Mode Expiring and scanner screenshots appear upright on restrained surfaces inside 290px desktop / up to 280px mobile phone frames. The scanner retains the original camera blur, sheet, and dimmed Inventory context.
- Accepted copy, centered introduction, system typography, official App Store badge, navigation, compact Free/Pro section, FAQs, and legal content are retained.

## Asset handling and sizes

Original files remain unchanged, including filename casing. Source SHA-256 hashes, original dimensions and bytes, responsive candidates, alt text, actual derivative dimensions, and crop coordinates are recorded in the generated data files. `scripts/optimize-images.py` uses local Pillow tooling; no image-processing build dependency was added. Derivatives live in `src/assets/optimized/`; originals are excluded from production passthrough copying.

| Asset | Original bytes | WebP bytes: smallest / middle / largest |
| --- | ---: | ---: |
| Inventory (1290×2796) | 1,184,304 | 21,558 / 52,018 / 87,406 |
| Inventory detail (1170×840 crop) | same Inventory source | 9,212 / 22,470 / 38,738 |
| Expiring (1290×2796) | 1,166,020 | 22,938 / 54,398 / 92,900 |
| Scanner (1290×2796) | 1,466,799 | 24,412 / 56,606 / 92,284 |
| Icon (1024×1024) | 995,304 | 6,526 / 19,548 / 41,964 |

Screenshot widths: 320 / 640 / 960px. Icon widths: 96 / 192 / 288px. Total source size is 4,812,427 bytes; the four displayed screenshot instances plus icon total 84,646 / 205,040 / 353,292 bytes depending on selected variants, excluding the badge and favicons. One candidate is loaded per image, and lower screenshots load lazily.

## Validation

- Production build and output checks pass for `/pantoryweb/` with the GitHub Pages origin and `/` with `https://getpantory.com`. Default output is restored to the existing GitHub Pages configuration.
- The recursive output checker now checks every `srcset` candidate as well as links, anchors, assets, metadata, canonicals, and required legacy pages. A temporary missing responsive candidate was correctly rejected; test edits were restored.
- All generated image dimensions and byte sizes match metadata. Original source hashes match, and icon transparency is retained. HTML width/height attributes match the actual default derivatives, reserving image space before loading; CSS uses natural height, with no fixed-height crop or app-content overlay. Per the latest user request, the three full screenshots now have CSS iPhone-style frames, side buttons, and a Dynamic Island over the screenshot status-bar area. The Inventory detail crop remains unframed.
- Hero image is eager with high fetch priority. The other three screenshot instances are lazy. All inspected images loaded successfully, including responsive variants selected by the browser.
- Reviewed at 1440px desktop, 390px mobile, and 320px narrow mobile, including full-page captures. No horizontal overflow. Desktop frame/crop widths are 320 / 300 / 290 / 290px. At 390px they render at 280px; at 320px they fit available space (265px hero, 249px features). Full screenshot content is inset within the frame. Frame overflow was rechecked at 320px and no horizontal overflow or image clipping was found.
- At 320px the headline ends around 348px and the main download action ends around 543px, keeping both in the first 740px viewport. Focus outlines remain visible, and Enter toggles native FAQs.
- Privacy and terms main-content wording matches the original Git versions after removing markup and normalizing whitespace. Existing URLs and App Store links are preserved. Production HTML has no JavaScript.
- `git diff --check` passes.

## Evidence and limits

`desktop-hero.jpg`, `desktop.jpg`, `mobile.jpg` (390px), and `mobile-320.jpg` show the current site. Full screenshots, the detail crop, and the icon were visually inspected. Primary screenshot headings and rows are discernible; secondary app labels are small at narrow widths. Camera-preview blur remains as supplied. Physical iPhone/high-density Safari testing and social preview artwork remain deferred; no measured CLS score is claimed.

README.md explains replacing originals and regenerating all derivatives. The live preview is http://localhost:8080/pantoryweb/; restart with `npm run dev` if needed. No supporting pages, articles, analytics, deployment infrastructure, commits, pushes, or DNS changes were added.

## Supplied frame reference

The latest frame recreates the user's supplied `4.png`: approximately 17% outer corner radii, thin layered black/metallic bezels, correctly positioned side buttons, an earpiece edge, and a floating Dynamic Island with sensor and blue lens detail. Removed the earlier artificial top and bottom display extensions so the status bar and island align like the reference.

The hardware is an independent foreground layer at z-index 2; the screenshot is at z-index 0. The island overlays the status-bar area, and rounded display corners sit inside the bezel. Main app controls remain visible, and source images are unchanged. The hardware is decorative and ignores pointer events. Desktop, 390px, and 320px captures were replaced. Browser inspection confirms all three hardware layers are above their images and no horizontal overflow at 320px. Build, output checks, and diff whitespace checks pass.
