# Pantory Pages deployment

## Before the cutover

The existing deployment and remote `main` were both at `6886c9d3c3fe0ed52ec2e119d6f60c991cd95a1e`. Pages settings showed **Deploy from a branch**, `main`, `/ (root)`, an empty custom domain, and HTTPS enforced for the default host. The homepage, `privacy.html`, and `terms.html` each returned HTTP 200 at their existing project URLs with the expected content. The old site is preserved on the remote `pages-rollback-6886c9d` branch. [Previous Pages run](https://github.com/salamdawood/pantoryweb/actions/runs/34502215481)

Namecheap’s authoritative servers `dns1.registrar-servers.com` and `dns2.registrar-servers.com` agreed. Namecheap Advanced DNS showed an apex URL redirect and a parking CNAME. The apex answered with `162.255.119.89` and HTTP redirected to `http://www.getpantory.com/`. The `www` CNAME was `parkingpage.namecheap.com.` with a 1,800-second TTL. There were no apex AAAA or CAA records. HTTPS on the apex timed out during the preflight. Private Email was enabled and both priority-10 MX records (`mx1.privateemail.com.` and `mx2.privateemail.com.`) and SPF (`v=spf1 include:spf.privateemail.com ~all`) were present. Preserve the Private Email settings and any mail-related records.

## Publish

1. Set the repository’s Pages source to **GitHub Actions** before pushing the reviewed `main`, which removes the old root HTML. Run **Deploy Pantory to GitHub Pages** on `main` with target `project`. Verify the three legacy URLs and confirm the run’s revision before connecting the domain.
2. Verify `getpantory.com` in the GitHub account’s Pages settings with the exact TXT record shown there. Retain that record. Save `getpantory.com` as the repository’s Pages custom domain. [GitHub domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
3. Replace the apex URL redirect with four A records at `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Update the `www` CNAME to `salamdawood.github.io.` so Pages handles the redirect to the apex. Preserve mail records and TXT verification. Run the workflow with target `custom-domain` and enable **Enforce HTTPS** as soon as Pages offers it. [GitHub custom domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
4. Test HTTP and HTTPS on the apex and www, then verify the apex homepage, Features, Support, Privacy, Terms, sitemap, robots, social PNG, screenshot assets, and App Store destination. Request the exact legacy URLs below and check their final status, canonical URL, and content. If any fail, roll back or verify a compatibility fix before declaring the launch complete.

- https://salamdawood.github.io/pantoryweb/
- https://salamdawood.github.io/pantoryweb/privacy.html
- https://salamdawood.github.io/pantoryweb/terms.html

The workflow checks that the configured Pages host and path match the selected target. Its build job installs from the lockfile, runs isolated blog checks, builds and validates Eleventy, and uploads only `_site`. The deploy job owns the Pages write and OIDC permissions.

## Roll back

For a failed custom domain cutover, restore the prior Namecheap web records from the snapshot (the apex unmasked redirect to `http://www.getpantory.com/` and the parking CNAME). Preserve Private Email and ownership verification. Remove the repository custom domain and run the last verified project deployment again once Pages reports the default host. If the project deployment is also unavailable, set Pages to **Deploy from a branch**, select `pages-rollback-6886c9d` and `/ (root)`, and save. Verify HTTP 200 and the correct content at all three legacy URLs. This restores the old site without rewriting `main`.

Mailbox delivery and physical iPhone/Safari checks require owner verification.
