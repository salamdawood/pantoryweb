const urls = require('../../site.config.js')();
module.exports = {
  name: 'Pantory',
  url: urls.origin,
  basePath: urls.basePath,
  appStore: 'https://apps.apple.com/us/app/pantry-inventory-pantory/id6772602868',
  support: 'support@getpantory.com',
  socialImage: {
    src: 'assets/optimized/pantory-social.png', width: 1200, height: 630,
    alt: 'Pantory app icon and the words: Know what you have. Use it before it expires.'
  }
};
