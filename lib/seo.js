function jsonForScript(value) {
  const escapes = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' };
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => escapes[character]);
}
function application(site, icon, urlFor) {
  return {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    '@id': urlFor('') + '#pantory', name: site.name,
    description: 'Pantry inventory for iPhone.', url: urlFor(''),
    installUrl: site.appStore, image: urlFor(icon.src),
    operatingSystem: 'iOS', availableOnDevice: 'iPhone', applicationCategory: 'Pantry inventory'
  };
}
function article(data, urlFor) {
  return {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    '@id': urlFor(data.url) + '#article', url: urlFor(data.url),
    headline: data.title, description: data.description,
    author: { '@type': data.authorType || 'Organization', name: data.author },
    datePublished: new Date(data.date).toISOString(),
    ...(data.updated ? { dateModified: new Date(data.updated).toISOString() } : {}),
    about: { '@id': urlFor('') + '#pantory' }
  };
}
module.exports = { jsonForScript, application, article };
