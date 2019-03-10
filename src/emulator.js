const { JSDOM } = require('jsdom');

const globals = require('./globals');
const { isString, } = require('./helpers');

const argv = process.argv.slice(2);
const args = {
  html: argv[0],
  characterId: argv[1],
  script: argv[2],
};

const window = (new JSDOM(args.html, {
  userAgent: globals.userAgent,
  url: globals.baseUrl,
  referrer: globals.baseUrl,
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
})).window;

// shorter version for log_in
const login = () => window.log_in(window.user_id, args.characterId, window.user_auth);

let damage = 0;

// wait for resources to be loaded 
window.addEventListener('load', () => {
  // socket welcomed, ready to login
  if (window.socket_welcomed) {
    login();
  }

  // socket not yet welcomed, listening for event
  window.socket.on(globals.WELCOME, () => {
    if (!window.character) {
      login();
    }
  });

  // successful login
  window.socket.on(globals.START, data => {
    process.send({
      type: globals.START,
      data: data,
    });
    if (args.script) {
      window.start_runner(null, args.script);
    }
    sendUpdates();
  });

  window.socket.on(globals.HIT, data => {
    if (window.character && data.hid === window.character.id) {
      damage += data.damage;
    }
  });

  window.socket.on(globals.DISCONNECT, () => {
    process.send({
      type: globals.DISCONNECT,
      data: window.disconnect_reason || 'No reason supplied',
    });
  });

  window.socket.on(globals.GAMEERROR, data => {
    const error = isString(data) ? data : data.message;
    // unsuccessful login
    if (/Failed: (ingame|wait_\d+_seconds)/.test(error)) {
      process.send({
        type: globals.GAMEERROR,
        data: error,
      });
      const match = data.match(/wait_(\d+)_seconds/);
      const seconds = match ? parseInt(match[1]) + 1 : 40;
      setTimeout(() => login(), seconds * 1000);
    }
  });

  window.socket.on(globals.GAMELOG, data => {
    process.send({
      type: globals.GAMELOG,
      data: isString(data) ? data : data.message,
    });
  });
});

/**
 * Send game updates with character specific stats once per second.
 */
function sendUpdates() {
  setInterval(() => {
    // TODO: support the merchant with update about gold, items, etc. (needs some special property to recognize)
    if (!window.character || window.character.ctype === 'merchant') {
      return;
    }
    
    const target = window.ctarget && window.ctarget.mtype
      ? window.G.monsters[window.ctarget.mtype].name
      : undefined;

    process.send({
      type: globals.UPDATE,
      data: {
        items: window.character.items,
        level: window.character.level,
        gold: window.character.gold,
        xp: window.character.xp,
        max_xp: window.character.max_xp,
        hp: window.character.hp,
        mp: window.character.mp,
        max_hp: window.character.max_hp,
        max_mp: window.character.max_mp,
        rip: window.character.rip,
        damage: damage,
        target: target,
      }
    });
    // reset damage
    damage = 0;
  }, 1000);
}