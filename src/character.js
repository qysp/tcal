const { createWriteStream } = require('fs');

/**
 * Create a character instance.
 * @param {string} id character's id
 * @param {string} name character's name
 * @param {string} cls character's class/type
 */
function Character(id, name, cls) {
  this.id = id;
  this.name = name;
  this.cls = cls;
}

/**
 * Create a write stream to a logfile.
 * @param {string} path the path to the logfile
 */
Character.prototype.createLog = function(path) {
  this.logfileStream = createWriteStream(path);
}

/**
 * Log a message into the character's file using the stream.
 * @param {string} message the message to log
 */
Character.prototype.log = function(message) {
  if (this.logfileStream) {
    this.logfileStream.write(`${message}\n`);
  }
}

/**
 * Close the logfile stream.
 */
Character.prototype.closeLog = function() {
  if (this.logfileStream) {
    this.logfileStream.close();
  }
}

/**
 * Initialize the status update data processor.
 * @param {number} timeFrame time frame in seconds for which to keep specific data like damage, gold or xp
 */
Character.prototype.initProcessor = function (timeFrame) {
  this.timeFrame = timeFrame;

  this.damageData = [];
  this.goldData = [];
  this.xpData = [];
}

/**
 * Process the data of a status update from a subprocess.
 * @param {Object} data the status update data
 * @param {Object[]} data.items character's items
 * @param {string} data.items[].name item's name
 * @param {number} [data.items[].q] item's quanitity
 * @param {number} [data.items[].level] item's (upgrade) level
 * @param {number} data.level character's level
 * @param {boolean} data.rip whether the character is dead
 * @param {string} data.target character's target name or undefined (no target)
 * @param {number} data.xp character's current xp
 * @param {number} data.max_xp character's maximum xp for this level
 * @param {number} data.hp character's current hp
 * @param {number} data.max_hp character's maximum hp for this level
 * @param {number} data.mp character's current mp
 * @param {number} data.max_mp character's maximum mp for this level
 * @param {number} data.damage character's damage done within the last time period (i.e. 1 second)
 * @param {number} data.gold character's current gold
 */
Character.prototype.processUpdate = function (data) {
  if (!this.timeFrame) {
    throw new Error('Data processor has not been initialized yet');
  }

  // keep dmg/gold/xp of the last X seconds defined by `timeFrame`
  if (this.damageData.length === this.timeFrame) this.damageData.shift();
  if (this.goldData.length === this.timeFrame) this.goldData.shift();
  if (this.xpData.length === this.timeFrame) this.xpData.shift();

  this.damageData.push(data.damage);

  // subtract previous gold/xp value from current gold/xp
  this.goldData.push(this.gold - data.gold);

  if (this.level < data.level) {
    this.xpData.length = 0;
  } else {
    this.xpData.push(this.xp - data.xp);
  }

  // set latest gold amount, dps, gps, xpps
  this.gold = data.gold;
  this.dps = this.damageData.reduce((acc, cur) => acc + cur) / this.damageData.length;
  this.gps = this.goldData.reduce((acc, cur) => acc + cur) / this.goldData.length;
  this.xpps = this.xpData.reduce((acc, cur) => acc + cur) / this.xpData.length;

  // set (max) xp/hp/mp and the percentage value
  this.xp = data.xp;
  this.maxXp = data.max_xp;
  this.xpPct = ((data.xp / data.max_xp) * 100).toFixed(2);
  this.hp = data.hp;
  this.maxHp = data.max_hp;
  this.hpPct = ((data.hp / data.max_hp) * 100).toFixed(2);
  this.mp = data.mp;
  this.maxMp = data.max_mp;
  this.mpPct = ((data.mp / data.max_mp) * 100).toFixed(2);

  this.level = data.level;
  this.rip = data.rip;
  this.target = data.target;
  this.invSlots = data.items.length;
  this.usedInvSlots = data.items
    .filter(item => item === null).length;
}

module.exports = Character;