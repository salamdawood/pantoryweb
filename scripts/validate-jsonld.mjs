import assert from 'node:assert/strict';

export function readStructuredData(html, label = 'page') {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  assert.equal(scripts.length, (html.match(/<script\b/gi) || []).length, `${label}: unclosed script`);
  return scripts.map(([, attributes, body]) => {
    assert(/^\s*type\s*=\s*["']application\/ld\+json["']\s*$/i.test(attributes), `${label}: unexpected executable script or script attributes`);
    assert(!/[<>&\u2028\u2029]/.test(body), `${label}: JSON-LD must be escaped for an HTML script context`);
    let data;
    try { data = JSON.parse(body); }
    catch { throw new Error(`${label}: malformed JSON-LD`); }
    assert(data && !Array.isArray(data) && data['@context'] === 'https://schema.org', `${label}: invalid JSON-LD object/context`);
    assert(['SoftwareApplication', 'BlogPosting'].includes(data['@type']), `${label}: unexpected structured data type`);
    return data;
  });
}
