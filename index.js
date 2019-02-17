const path = require('path');
const AdventureLandClient = require('./src/client');
const { tryTo, handleError, showHelp, } = require('./src/helpers');

async function run() {
  // try to require the necessary config file
  const config = await tryTo(require, path.join(__dirname, 'config'))
    .then(ret => ret)
    .catch(error => handleError('REQUIRE_FILE_ERROR', error));

  // init Adventure Land client
  const client = new AdventureLandClient(config);

  // async login
  await client.login();
}

run();