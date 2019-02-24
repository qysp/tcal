const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const { fork } = require('child_process');

const AdventureLandClient = require('./src/client');
const { tryTo, handleError, validateConfig, } = require('./src/helpers');


(async () => {
  // try to require the necessary config file
  const config = await tryTo(require, path.join(__dirname, 'config'))
    .catch(err => handleError(err, true));

  // validate the config file and exit on error
  await validateConfig(config)
    .catch(err => handleError(
      `${err}\ncheck the README for more information on the config typings and structure`,
      true));

  // init Adventure Land client
  const client = new AdventureLandClient(config);

  // login, on error exit
  await client.login();

  // build the character's/server's file path
  const charactersPath = path.join(__dirname, 'data', 'characters.json');
  const serversPath = path.join(__dirname, 'data', 'servers.json');

  // fetch characters if needed/requested
  if (argv.fetch || !fs.existsSync(charactersPath)) {
    const characters = await client.getCharacters()
      .then(chars => chars.map(c => ({ id: c.id, name: c.name, type: c.type })));
    fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 4));
  }

  // fetch servers if needed/requested
  if (argv.fetch || !fs.existsSync(serversPath)) {
    const servers = await client.getServers();
    fs.writeFileSync(serversPath, JSON.stringify(servers, null, 4));
  }

  // get the character selection page
  let html = await client.getData('?no_html=true&no_graphics=true', true)
    .catch(err => handleError(err, true));

  // to minimize the the read operations
  const scriptCache = {};

  for (const activeChar of config.active) {
    // get and parse characters.json
    const characterData = await tryTo(fs.readFileSync, charactersPath)
      .then(buf => JSON.parse(buf.toString()))
      .catch(err => handleError(err, true));

    // get and parse servers.json
    const serverData = await tryTo(fs.readFileSync, serversPath)
      .then(buf => JSON.parse(buf.toString()))
      .catch(err => handleError(err, true));

    // find matching character (for the character id)
    const activeCharData = characterData.find(c => 
      activeChar.name.toLowerCase() === c.name.toLowerCase());

    if (!activeCharData) {
      handleError(`Character '${activeChar.name}' does not exist in the data records`, true);
    }

    // find matching server (for the server ip/port)
    const activeServerData = serverData.find(s => 
      activeChar.region.toLowerCase() === s.region.toLowerCase() &&
      activeChar.server.toLowerCase() === s.name.toLowerCase());
    
    if (!activeServerData) {
      handleError(
        `A server with the properties: '${activeChar.region} ${activeChar.server}' does not exist in the data records`,
        true);
    }

    if (activeChar.script && !scriptCache[activeChar.script]) {
      // get the user's script
      const scriptPath = path.join(__dirname, 'scripts', activeChar.script);
      scriptCache[activeChar.script] = await tryTo(fs.readFileSync, scriptPath)
        .then(buf => buf.toString())
        .catch(err => handleError(err, true));
    }

    // TODO: find a cleaner way to set the desired server
    html = html
      .replace(/server_addr\s?=\s?"\w+\d+\.adventure.land"/, `server_addr="${activeServerData.ip}"`)
      .replace(/server_port\s?=\s?"\d+"/, `server_port="${activeServerData.port}"`)

    // args for the subprocess
    const args = [
      html,
      activeCharData.id,
      scriptCache[activeChar.script],
    ];

    // subprocess emulating a browser environment
    fork(path.join(__dirname, 'src', 'emulator.js'), args, { stdio: [ 'ipc' ] })
      .on('message', msg => console.log(msg)) // TODO: listen for events
      .on('error', err => handleError(err, true)); // TODO: don't exit the whole program on an error; retry(?)
  }
})();