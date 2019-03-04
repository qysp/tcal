const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const { fork } = require('child_process');

const AdventureLandClient = require('./src/client');
const DataProcessor = require('./src/processor');
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
    const characters = await client.getCharacters()
      .then(chars => chars.map(c => ({ id: c.id, name: c.name, type: c.type })))
      .catch(err => handleError(err, true));
    fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 4));
  }

  // fetch servers if needed/requested
  if (argv.fetch || !fs.existsSync(serversPath)) {
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

  // to minimize the the read operations
  const scriptCache = {};

  const CHARACTERS = {};
  config.active.forEach(c => {
    CHARACTERS[c.name] = { online: false };
    if (argv.log) {
      CHARACTERS[c.name].stream = fs.createWriteStream(path.join(logsPath, `${c.name}.log`));
      // write current date at the top of the file
      CHARACTERS[c.name].stream.write(`${new Date().toISOString()}\n\n`);
    }
  });

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
      handleError(`Server: '${activeChar.region} ${activeChar.server}' does not exist in the data records`, true);
    }

    if (activeChar.script && !scriptCache[activeChar.script]) {
      // get the user's script
      const scriptPath = path.join(__dirname, 'scripts', activeChar.script);
      scriptCache[activeChar.script] = await tryTo(fs.readFileSync, scriptPath)
        .then(buf => buf.toString())
        .catch(err => handleError(err, true));
    }

    // TODO: find a cleaner way to set the desired server
    mainPageHtml = mainPageHtml
      .replace(/server_addr\s?=\s?"\w+\d+\.adventure.land"/, `server_addr="${activeServerData.ip}"`)
      .replace(/server_port\s?=\s?"\d+"/, `server_port="${activeServerData.port}"`);

    // args for the subprocess
    const args = [
      mainPageHtml,
      activeCharData.id,
      scriptCache[activeChar.script],
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

    console.log(`Created subprocess for: ${activeChar.name}`);

    subprocess
      .on('message', msg => {
        switch (msg.type) {
          // character successfully logged in
          case globals.START:
            CHARACTERS[activeChar.name].online = true;
            CHARACTERS[activeChar.name].processor = new DataProcessor(
              activeCharData.id,
              activeChar.name,
              activeCharData.type
            );
            console.log(`Successfully logged in: ${activeChar.name}`);
            break;
          // disconnect signal sent
          case globals.DISCONNECT:
            CHARACTERS[activeChar.name].online = false;
            if (argv.log) {
              CHARACTERS[activeChar.name].stream.close();
            }
            subprocess.kill();
            console.log(`Disconnected: ${activeChar.name}\n${msg.data}`);
            break;
          // generic game error, e.g. while logging in
          case globals.GAMEERROR:
            console.log(`Game error: ${activeChar.name}\n${msg.data}`);
            break;
          // generic game log, e.g. 'You killed a Goo'
          case globals.GAMELOG:
            if (argv.log) {
              CHARACTERS[activeChar.name].stream.write(`${msg.data}\n`);
            }
            break;
          // custom (raw) character data; sent once per second 
          case globals.UPDATE:
            CHARACTERS[activeChar.name].processor.update(msg.data);
            break;
        }
      })
      .on('error', err => handleError(err))
      .on('uncaughtException', err => handleError(err, true));
  }
})();