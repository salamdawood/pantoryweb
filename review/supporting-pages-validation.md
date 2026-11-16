# Supporting pages and blog foundation

Validated November 13, 2026.

## Final pages and behavior

- `/features/`: inventory capabilities, barcode/manual-entry limitations, expiration tracking, reminders, iCloud/sharing, History/widget, an accessible Free/Pro comparison, and one download badge.
- `/support/`: prominent `support@getpantory.com` email link, practical native FAQs, conservative troubleshooting, required support details, and policy/feature links. Terms now uses the same centralized support email; its visible legal wording is unchanged.
- `/blog/`: an honest empty state. No real article, future article teaser, or link to an unpublished route.
- Shared navigation links to the actual Features, Blog, and Support pages. Current-page indicators use `aria-current="page"`; articles identify Blog with `aria-current="location"`. Mobile navigation uses two rows, without JavaScript.
- The accepted homepage body, images, phone frames, copy, and intentionally removed message below the hero badge are retained.

## Blog authoring

Markdown posts belong in `src/posts/`. Required front matter: title, description, explicit date, author, stable permalink, and boolean draft. An optional updated date cannot precede publication. Drafts are omitted by an Eleventy preprocessor, and the collection additionally filters published posts. Clean builds prevent stale output when a published post changes back to draft.

The article layout renders escaped title/description/author metadata, publication/update dates, readable Markdown, and a restrained download CTA. Article Open Graph type and publication metadata are supported. No structured data or other deferred SEO infrastructure was added.

`docs/post-template.md` is the non-public authoring template. `docs/blog-plan.md` records the first planned topic, “How to Keep Track of What’s in Your Freezer,” and future `/blog/freezer-inventory/` permalink. Its article is unwritten and its public route does not exist.

## Validation

- `npm run check:blog` passes under `/pantoryweb/` with `SITE_URL=https://salamdawood.github.io` and `/` with `SITE_URL=https://getpantory.com`, passing matching environment values to the build and output checker.
- Temporary Markdown fixtures verified nested permalinks, headings/lists/blockquote/links, quoted titles/descriptions/authors, ampersands, article metadata, optional updated dates, newest-first ordering, and draft exclusion from both HTML output and the index.
- A fixture was temporarily made public and then returned to draft; subsequent output and index entries were removed. Fixture source and output are now confined to an isolated temporary project, removed on success or failure. The live source and output are not rebuilt by `check:blog`.
- The recursive checker requires all six expected pages, unique titles/descriptions, correct canonicals/Open Graph URLs, internal links/anchors, image/srcset files, navigation/current-page indication, App Store links, and the updated support email. It also verifies the removed homepage hero message stays absent.
- Final output contains exactly homepage, Features, Support, Blog, privacy.html, and terms.html. No test articles, template pages, duplicate legal routes, or planned article exist in final output.
- Privacy and Terms text matches the existing legal content after stripping markup and normalizing whitespace. The Terms email destination changed at the user's explicit request.
- Browser review at 1440px desktop, 390px mobile, and 320px mobile. All six real pages plus the temporary article were checked at 320px with no horizontal overflow. The comparison table fits at 265px content width and has a caption plus row/column header scopes.
- Keyboard Tab focus shows a visible 3px outline. Enter expands/collapses Support FAQs. Shared navigation to Support was exercised. Article and page content work without JavaScript; generated output contains no scripts.
- `git diff --check` passes. No new dependencies were added.

## Review captures

Only four captures were added for this milestone:

- `supporting-features-desktop.jpg`: Features page on desktop.
- `supporting-support-mobile.jpg`: Support page at 390px, including the new email.
- `supporting-blog-320.jpg`: empty Blog index at 320px.
- `supporting-article-test.jpg`: article layout using clearly labeled temporary TEST FIXTURE content. This is not a published article.

The article capture came from a temporary localhost-only copy outside the repository. That server was stopped and the copy removed. The final production tree remains fixture-free.

## Limits and review

No unresolved product facts were introduced: capabilities and Free/Pro boundaries use the supplied facts, and troubleshooting avoids guarantees or destructive steps. Physical iPhone/Safari and assistive-technology testing remain outside this browser review. Social preview art, structured data, sitemap, robots configuration, analytics, deployment setup, and the first researched article remain deferred.

Local preview: http://localhost:8080/pantoryweb/ (restart with `npm run dev` if needed). No commit, push, deployment, or DNS change was performed by this chat.

## Supporting-pages review fixes

- Blog validation now copies the necessary source, configuration, package metadata, and output checker to an isolated temporary project. Installed dependencies are reused via a directory symlink, not copied. Every child build/check runs with that temporary working directory, so the configuration’s cleanup hook only removes temporary output.
- Both base-path fixture suites still verify escaped metadata, Markdown, article dates, ordering, draft exclusion, and removal of stale published output after switching a post to draft.
- Verified with `npm run dev` running: 123 requests to the actual homepage, Features, and Blog preview returned HTTP 200 while `npm run check:blog` ran. None served fixture content. Live `src/posts/` and `_site/` hashes and modification times were identical before and after the tests.
- Verified failure cleanup with a deliberately failing checker in a separate staged project: its isolated fixture project was removed. Successful test output was removed as well; no fixture posts remain in live source or output.
- Replaced the awkward History sentence on the homepage and Features page with “With Pro, add finished items back from History without rescanning.” Free/Pro boundaries and surrounding copy remain intact.
- Normal production build, output checker, and `git diff --check` pass. README now documents running isolated validation without stopping the preview. The old fixture-capture flag was removed so validation leaves no review copies behind.
