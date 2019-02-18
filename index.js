const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const AdventureLandClient = require('./src/client');
const { tryTo, handleError, } = require('./src/helpers');


async function run() {
  // try to require the necessary config file
  const config = await tryTo(require, path.join(__dirname, 'config'))
    .catch(err => handleError(err.message, true));

  // init Adventure Land client
  const client = new AdventureLandClient(config);

  // async login
  await client.login();

  // fetch characters if needed/requested
  const charactersPath = path.join(__dirname, 'data', 'characters.json');
  if (argv.fetch || !fs.existsSync(charactersPath)) {
    const characters = await client.getCharacters();
    fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 4));
  }

  // fetch servers if needed/requested
  const serversPath = path.join(__dirname, 'data', 'servers.json');
  if (argv.fetch || !fs.existsSync(serversPath)) {
    const servers = await client.getServers();
    fs.writeFileSync(serversPath, JSON.stringify(servers, null, 4));
  }

  // all game files that are needed
  const gameFiles = [
    'data.js',
    'js/game.js',
    'js/functions.js',
    'js/common_functions.js',
    'js/runner_functions.js',
  ];

  for (let gameFile of gameFiles) {
    const gameFilePath = path.join(
      __dirname,
      'game_files',
      gameFile.replace('js/', ''));

    if (argv.nocache || !fs.existsSync(gameFilePath)) {
      const data = await client.getGameFile(gameFile);
      if (!data) continue;
      fs.writeFileSync(gameFilePath, data);
    }
  }
}

run();