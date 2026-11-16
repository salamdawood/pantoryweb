# Pantory launch checklist

This is a review/deployment handoff, not authorization to publish. The accepted homepage, real assets, phone frames, product boundaries, and support address remain unchanged.

## Before approving deployment

- [ ] Review the generated site and social image. No article is published; `/blog/` is deliberately hidden, noindex, and excluded from the sitemap until content is approved.
- [ ] Choose the deployment target. Existing: `https://salamdawood.github.io/pantoryweb/`. Intended primary custom domain: `https://getpantory.com/`.
- [ ] Inspect and record the actual repository Pages source (Actions or branch/folder), deployed revision, workflow/artifact path, custom domain, domain-verification state, and HTTPS setting. No `.github` deployment workflow, `CNAME`, or `.nojekyll` was found in the local repository; remote settings were not inspected or changed.
- [ ] Confirm the hosting pipeline builds Eleventy and deploys **the contents of `_site/`**, not `src/` or repository source. Determine the appropriate publishing approach after inspecting existing settings. See [GitHub publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- [ ] Confirm `support@getpantory.com` receives mail using a user-operated mailbox check. No test email was sent by the assistant.
- [ ] Perform physical iPhone/Safari and assistive-technology checks: navigation, focus, skip link, FAQs, screenshot readability, and App Store handoff. Current browser audits do not substitute for these.

## Build and validate the selected artifact

```sh
npm ci

# Existing project-path deployment
SITE_URL=https://salamdawood.github.io BASE_PATH=/pantoryweb/ npm run build
SITE_URL=https://salamdawood.github.io BASE_PATH=/pantoryweb/ npm run check

# OR the future root custom-domain deployment
SITE_URL=https://getpantory.com BASE_PATH=/ npm run build
SITE_URL=https://getpantory.com BASE_PATH=/ npm run check

npm run check:blog
git diff --check
```

Use matching environment values for build and check; deploy only that target's artifact. Fixture checks build in temporary copies and do not alter `_site/`. Ensure no `test-fixture/` output or real post is accidentally included. Verify homepage, Features, Support, `/privacy.html`, `/terms.html`, favicon/touch icon, social image, screenshots/srcsets, App Store links, and mailto destinations. Review sitemap canonical URLs and robots sitemap pointer. `lastmod` is permitted only for an explicit genuine content update, not a build time.

## Domain and hosting migration — separate approved action

- [ ] Confirm apex `getpantory.com` as the canonical host and decide/verify `www.getpantory.com` behavior. Prefer one canonical HTTPS host and a redirect from the other; do not create duplicate indexable copies.
- [ ] Record current DNS and domain/HTTPS settings before changes. Obtain exact required records from the hosting provider's current instructions; this checklist does not assert current DNS values or provide invented records/tokens.
- [ ] Verify domain ownership and follow [GitHub's custom-domain procedure](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), including its required order of domain and DNS setup. Inspect potential conflicting records; retain mailbox-related records unless an approved mail change requires otherwise.
- [ ] After a separately approved migration, verify HTTPS certificate issuance, enforced HTTPS, and redirects for apex/www and HTTP/HTTPS. Check for mixed content and redirect loops.
- [ ] Inspect real response statuses and final destinations for `https://salamdawood.github.io/pantoryweb/`, `https://salamdawood.github.io/pantoryweb/privacy.html`, and `https://salamdawood.github.io/pantoryweb/terms.html`. Actual legacy redirects are unverified until migration; do not assume hosting handles them correctly.
- [ ] Verify production canonicals, Open Graph URLs/images, JSON-LD URLs, image assets, and sitemap all use `https://getpantory.com/` for the root deployment. Ensure legacy canonicals do not remain in the custom-domain artifact.
- [ ] Verify `/robots.txt` and `/sitemap.xml` at the custom hostname root. A project-path `/pantoryweb/robots.txt` does not control the shared `github.io` hostname. Robots is not draft privacy; draft HTML must be absent.

## Rollback plan — record before any migration

- [ ] Preserve the last working deployed revision and its complete built artifact. Record its origin/base-path build values.
- [ ] Record the prior Pages source/branch/folder or workflow, custom domain, HTTPS setting, DNS records, and TTLs with the responsible owner.
- [ ] Define the failure threshold and rollback owner (broken main/legal URLs, invalid certificate, redirect loop, wrong artifact, or missing assets).
- [ ] If rollback is approved, restore the last working artifact and recorded hosting/DNS settings as needed. Do not rebuild the old target with new-domain environment values.
- [ ] Recheck homepage, legal routes, App Store/mail links, assets, HTTPS, and canonical/sitemap consistency after rollback. Keep records until propagation is complete; do not guess previous settings.

## After launch

- [ ] User verifies the appropriate property in Search Console using an available verification method; no token or account access is assumed here.
- [ ] User submits the actual deployed sitemap URL and inspects representative URLs. See [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [ ] Test social cards against the live, publicly reachable image and its response headers/cache behavior. Local metadata checks cannot validate third-party scraper caches.
- [ ] Measure real production performance, including network conditions and field Core Web Vitals when enough data exists. Local cached navigation timings are not production scores.
- [ ] Confirm mailbox delivery, physical-device checks, and legacy URL behavior; record outcomes.

Analytics, campaign parameters, third-party tracking, and measurement setup are a later task. JSON-LD and a sitemap do not guarantee indexing, rich results, ranking, or AI-search inclusion.
