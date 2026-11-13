const basePath = process.env.BASE_PATH || "/pantoryweb/";
module.exports = {
  name: "Pantory",
  // Keep the deployed origin here until the custom-domain migration is verified.
  url: (process.env.SITE_URL || "https://salamdawood.github.io").replace(/\/$/, ""),
  basePath,
  appStore: "https://apps.apple.com/us/app/pantry-inventory-pantory/id6772602868",
  support: "salamd135@gmail.com"
};
