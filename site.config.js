// Shared by Eleventy, global data, sitemap/robots, and validation.
module.exports = function siteConfig(env = process.env) {
  const input = (env.SITE_URL || 'https://salamdawood.github.io').trim();
  const parsed = new URL(input);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || !/^\/*$/.test(parsed.pathname)) {
    throw new Error('SITE_URL must be an HTTPS origin, without a path, credentials, query, or fragment.');
  }
  const segments = (env.BASE_PATH ?? '/pantoryweb/').trim().split('/').filter(Boolean);
  if (segments.some(segment => !/^[a-zA-Z0-9_-]+$/.test(segment))) throw new Error('BASE_PATH contains an invalid path segment.');
  const basePath = segments.length ? `/${segments.join('/')}/` : '/';
  const origin = parsed.origin;
  if (origin === 'https://salamdawood.github.io' && basePath !== '/pantoryweb/') {
    throw new Error('The existing GitHub Pages origin requires BASE_PATH=/pantoryweb/.');
  }
  if (parsed.hostname === 'getpantory.com' || parsed.hostname === 'www.getpantory.com') {
    if (!env.SITE_URL || env.BASE_PATH === undefined || basePath !== '/') {
      throw new Error('Custom-domain production builds require explicit SITE_URL and BASE_PATH=/.');
    }
  }
  function pathFor(value = '') {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//') || value.includes('..') || value.includes('\\')) {
      throw new Error('Site URLs must use local paths.');
    }
    return basePath + value.replace(/^\/+/, '');
  }
  return { origin, basePath, pathFor, urlFor: value => origin + pathFor(value) };
};
