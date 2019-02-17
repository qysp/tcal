const path = require('path');
const AdventureLandClient = require('./src/client');
const { tryTo, handleError, } = require('./src/helpers');

async function run() {
  // try to require the necessary config file
  const config = await tryTo(require, path.join(__dirname, 'config'))
    .then(ret => ret)
    .catch(err => handleError(err, true));

  // init Adventure Land client
  const client = new AdventureLandClient(config);

  // async login
  await client.login();
}

run();