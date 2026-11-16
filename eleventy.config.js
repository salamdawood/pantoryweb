const fs = require("node:fs");
const path = require("node:path");
const urls = require('./site.config.js')();
const { jsonForScript, application, article } = require('./lib/seo.js');
function publishedPosts(api) {
  return api.getFilteredByGlob('./src/posts/**/*.md').filter(post => post.data.draft === false);
}

function asDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new Error(`Invalid publication date: ${value}`);
  return date;
}

module.exports = function (eleventyConfig) {
  // Every full build, including watch rebuilds, starts clean so removed/draft posts cannot linger.
  eleventyConfig.on("eleventy.before", () => fs.rmSync(path.join(__dirname, "_site"), { recursive: true, force: true }));
  eleventyConfig.addPassthroughCopy({
    "src/assets/style.css": "assets/style.css",
    "src/assets/pages.css": "assets/pages.css",
    "src/assets/app-store-badge.svg": "assets/app-store-badge.svg",
    "src/assets/optimized": "assets/optimized"
  });
  eleventyConfig.addWatchTarget('./site.config.js');
  eleventyConfig.addWatchTarget('./lib/');
  eleventyConfig.addFilter('assetUrl', urls.pathFor);
  eleventyConfig.addFilter('absoluteUrl', urls.urlFor);
  eleventyConfig.addFilter('appJsonLd', (site, icon) => jsonForScript(application(site, icon, urls.urlFor)));
  eleventyConfig.addFilter('articleJsonLd', data => jsonForScript(article(data, urls.urlFor)));
  eleventyConfig.addFilter("dateISO", value => asDate(value).toISOString());
  eleventyConfig.addFilter("dateLabel", value => new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
  }).format(asDate(value)));
  eleventyConfig.addPreprocessor("post-front-matter", "md", function (data) {
    if (!this.inputPath.replaceAll("\\", "/").startsWith("./src/posts/")) return;
    for (const field of ["title", "description", "author", "permalink"]) {
      if (typeof data[field] !== "string" || !data[field].trim()) {
        throw new Error(`${this.inputPath}: ${field} must be a non-empty string`);
      }
    }
    const source = fs.readFileSync(this.inputPath, "utf8");
    const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontMatter || !/^date:\s*\S/m.test(frontMatter[1])) throw new Error(`${this.inputPath}: explicit date is required`);
    asDate(data.date);
    if (data.updated && asDate(data.updated) < asDate(data.date)) throw new Error(`${this.inputPath}: updated precedes date`);
    if (typeof data.draft !== "boolean") throw new Error(`${this.inputPath}: draft must be true or false`);
    if (!/^\/blog\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/$/.test(data.permalink)) {
      throw new Error(`${this.inputPath}: use a stable /blog/slug/ permalink`);
    }
    if (data.authorType && !['Person', 'Organization'].includes(data.authorType)) throw new Error('authorType must be Person or Organization');
    if (data.draft) return false;
  });
  eleventyConfig.addCollection("posts", api => publishedPosts(api)
    .sort((a, b) => asDate(b.data.date) - asDate(a.data.date) || a.url.localeCompare(b.url)));
  eleventyConfig.addCollection('sitemapPages', api => {
    const hasPosts = publishedPosts(api).length > 0;
    return api.getAll().filter(item => item.url && (item.url.endsWith('/') || item.url.endsWith('.html'))
      && !item.data.draft && !item.data.noindex && item.data.sitemap !== false
      && (item.url !== '/blog/' || hasPosts)).sort((a, b) => a.url.localeCompare(b.url));
  });
  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: urls.basePath,
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
