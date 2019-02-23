const jsdom = require('jsdom');

const { baseUrl, } = require('./globals');

const argv = process.argv.slice(2);
const { JSDOM } = jsdom;

(async () => {
  const args = {
    html: argv[0],
    characterId: argv[1],
    script: argv[2],
  };

  const window = (new JSDOM(args.html, {
    userAgent: 'TCAL: (v1.0.0)',
    url: baseUrl,
    referrer: baseUrl,
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse: window => {
      window.eval('var requestAnimationFrame = window.requestAnimationFrame;')
    },
  })).window;

  // TODO: could you realiably overwrite the server_addr / server_port before the socket is initialized?

  // await the resource loading (initiaization of necessary window properties)
  await new Promise(resolve => setInterval(() => window.socket && resolve(), 100));

  // shorter version
  const login = () => window.log_in(window.user_id, args.characterId, window.user_auth);

  // game loaded, ready to login
  window.socket.on('welcome', () => {
    login();
    console.log('[JSDOM]: Logging in...');
  });

  // unsuccessful login
  window.socket.on('game_error', err => {
    let match;
    if (err === 'Failed: ingame') {
      setTimeout(() => login(), 35000);
    } else if ((match = err.match(/wait_(\d+)_seconds/))) {
      setTimeout(() => login(), match[1])
    }
  });

  // successful login
  window.socket.on('start', () => {
    console.log(`[JSDOM]: Character loaded '${window.character.name}'`);
    if (args.script) {
      window.start_runner(undefined, args.script);
    }
  });

  window.socket.on('game_log', () => {
    // TODO: forward to 'frontend'
  });
})();