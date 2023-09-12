const fanout = require("fanoutpub");

const publisher = new fanout.Fanout(
  process.env.FANOUT_REALM_ID,
  process.env.FANOUT_REALM_KEY
);

module.exports = publisher;
