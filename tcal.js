const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const { fork } = require('child_process');

const AdventureLandClient = require('./src/client');
const TerminalInterface = require('./src/interface');
const Character = require('./src/character');
const globals = require('./src/globals');
const { tryTo, handleError, validateConfig, } = require('./src/helpers');

(async () => {
  // try to require the necessary config file
  const config = await tryTo(require, path.join(__dirname, 'config'))
    .catch(err => handleError(err, true));

  // validate the config file and exit on error
  await validateConfig(config)
    .catch(err => handleError(err, true));

  // init Adventure Land client
  const client = new AdventureLandClient(config);

  // login, on error exit
  await client.login()
    .catch(err => handleError(err, true));

  // build the character's/server's file path
  const charactersPath = path.join(__dirname, 'data', 'characters.json');
  const serversPath = path.join(__dirname, 'data', 'servers.json');
  const logsPath = path.join(__dirname, 'logs');

  // fetch characters if needed/requested
  if (argv.fetch || !fs.existsSync(charactersPath)) {
    console.log('Fetching characters');
    const characters = await client.getCharacters()
      .then(chars => chars.map(c => ({ id: c.id, name: c.name, type: c.type })))
      .catch(err => handleError(err, true));
    fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 4));
  }

  // fetch servers if needed/requested
  if (argv.fetch || !fs.existsSync(serversPath)) {
    console.log('Fetching servers');
    const servers = await client.getServers()
      .catch(err => handleError(err, true));
    fs.writeFileSync(serversPath, JSON.stringify(servers, null, 4));
  }

  // create logs folder if it does not exist and the `log` start parameter is used
  if (argv.log && !fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath);
  }

  // get the main (character selection) page
  let mainPageHtml = await client.getData('?no_html=true&no_graphics=true', true)
    .catch(err => handleError(err, true));

  let terminalInterface;
  if (argv.interface) {
    terminalInterface = new TerminalInterface();
  }

  for (const activeChar of config.active) {
    let script;

    // find matching character
    const characterData = await tryTo(fs.readFileSync, charactersPath)
      .then(buf => JSON.parse(buf.toString()).find(c =>
        activeChar.name.toLowerCase() === c.name.toLowerCase()))
      .catch(err => handleError(err, true));

    if (!characterData) {
      handleError(`Character '${activeChar.name}' does not exist in the data records`, true);
    }

    // find matching server
    const serverData = await tryTo(fs.readFileSync, serversPath)
      .then(buf => JSON.parse(buf.toString()).find(s => 
        activeChar.region.toLowerCase() === s.region.toLowerCase() &&
        activeChar.server.toLowerCase() === s.name.toLowerCase()))
      .catch(err => handleError(err, true));
    
    if (!serverData) {
      handleError(`Server: '${activeChar.region} ${activeChar.server}' does not exist in the data records`, true);
    }

    // get the user's script (if defined)
    if (activeChar.script) {
      script = await tryTo(fs.readFileSync, path.join(__dirname, 'scripts', activeChar.script))
        .then(buf => buf.toString())
        .catch(err => handleError(err, true));
    }

    const character = new Character(
      characterData.id,
      activeChar.name,
      characterData.type
    );

    if (argv.log) {
      character.createLog(path.join(logsPath, `${activeChar.name}.log`));
      character.log(new Date().toISOString());
    }

    if (argv.interface) {
      character.initProcessor(60);
    }

    // TODO: find a cleaner way to set the desired server
    mainPageHtml = mainPageHtml
      .replace(/server_addr\s?=\s?"\w+\d+\.adventure.land"/, `server_addr="${serverData.ip}"`)
      .replace(/server_port\s?=\s?"\d+"/, `server_port="${serverData.port}"`);

    // args for the subprocess
    const args = [
      mainPageHtml,
      character.id,
      script,
    ];

    const stdioOpts = [ 'ipc' ];
    if (argv.verbose) {
      stdioOpts.push(0, 1, 2);
    }

    // subprocess emulating a browser environment
    const subprocess = fork(
      path.join(__dirname, 'src', 'emulator.js'),
      args,
      { stdio: stdioOpts }
    );

    subprocess
      .on('message', msg => {
        switch (msg.type) {
          // character successfully logged in
          case globals.START:
            if (argv.interface) {
              terminalInterface.log('Logged in', activeChar.name);
            } else {
              console.log(`[LOGIN] ${activeChar.name}`);
            }
            break;

          // disconnect signal sent
          case globals.DISCONNECT:
            if (argv.log) {
              character.log(`[DISCONNECTED] ${msg.data}`);
              character.closeLog();
            }
            if (argv.interface) {
              terminalInterface.log(`Disconnected: ${msg.data}`, activeChar.name);
            } else {
              console.log(`[${activeChar.name}] Disconnected: ${msg.data}`);
            }
            subprocess.kill();
            break;

          // generic game error, e.g. while logging in
          case globals.GAMEERROR:
            if (argv.log) {
              character.log(`[ERROR] ${msg.data}`);
            }
            if (argv.interface) {
              terminalInterface.log(`Game error: ${msg.data}`, activeChar.name);
            } else {
              console.log(`[${activeChar.name}] Game error: ${msg.data}`);
            }
            break;

          // generic game log, e.g. 'You killed a Goo'
          case globals.GAMELOG:
            if (argv.log) {
              character.log(`[GAME] ${msg.data}`);
            }
            if (argv.interface) {
              terminalInterface.log(msg.data, activeChar.name);
            }
            break;

          // custom (raw) character data; sent once per second
          case globals.UPDATE:
            character.processUpdate(msg.data);
            if (argv.interface) {
              terminalInterface.setData(character);
            }
            break;
        }
      })
      .on('error', err => handleError(err))
      .on('uncaughtException', err => handleError(err, true));
  }
})();