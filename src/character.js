const { createWriteStream } = require('fs');

/**
 * Create a character instance.
 * @param {String} id 
 * @param {String} name 
 * @param {String} cls 
 */
function Character(id, name, cls) {
  this.id = id;
  this.name = name;
  this.cls = cls;

  this.online = false;
}

/**
 * Create a write stream to a logfile.
 * @param {String} path the path to the logfile
 */
Character.prototype.createLog = function(path) {
  this.logfileStream = createWriteStream(path);
}

/**
 * Log a message into the character's file using the stream.
 * @param {String} message the message to log
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
 * @param {Number} timeFrame time frame in seconds for which to keep specific data like damage, gold or xp
 */
Character.prototype.initProcessor = function(timeFrame) {
  this.timeFrame = timeFrame;

  this.damageData = [];
  this.goldData = [];
  this.xpData = [];
}

/**
 * Process the data of a status update from a subprocess.
 * @param {Object} data the status update data
 */
Character.prototype.processUpdate = function(data) {
  if (!this.timeFrame) {
    throw new Error('Data processor has not been initialized yet');
  }
  this.items = [];
  this.level = data.level;
  this.rip = data.rip;
  this.target = data.target;
  this.invSlots = data.items.length;
  this.usedInvSlots = data.items.filter(i => i).length;

  // accumulate all items + quantity by name/level
  // TODO: needed?
  data.items
    .filter(i => i !== null)
    .forEach(item => {
      const index = this.items.findIndex(i =>
        i.name === item.name && (!item.level || i.level === item.level));

      if (index === -1) {
        this.items.push({
          name: item.name,
          quantitiy: item.q || 1,
          level: item.level,
        });
      } else {
        this.items[index].quantitiy += item.q || 1;
      }
  });

  // set (max) xp/hp/mp and the percentage value
  this.xp = data.xp;
  this.maxXp = data.max_xp
  this.xpPct = ((data.xp / data.max_xp) * 100).toFixed(2);
  this.hp = data.hp;
  this.maxHp = data.max_hp;
  this.hpPct = ((data.hp / data.max_hp) * 100).toFixed(2);
  this.mp = data.mp;
  this.maxMp = data.max_mp;
  this.mpPct = ((data.mp / data.max_mp) * 100).toFixed(2);

  // keep dmg/gold/xp of the last X seconds defined by `timeFrame`
  if (this.damageData.length === this.timeFrame) this.damageData.shift();
  if (this.goldData.length === this.timeFrame) this.goldData.shift();
  if (this.xpData.length === this.timeFrame) this.xpData.shift();
  this.damageData.push(data.damage)
  this.goldData.push(data.gold);
  this.xpData.push(data.xp);

  // set latest gold amount, dps/gps/xpps 
  this.gold = data.gold;
  this.dps = this.damageData.reduce((acc, cur) => acc + cur) / this.damageData.length;
  this.gps = this.goldData.reduce((acc, cur) => acc + cur) / this.goldData.length;
  this.xpps = this.xpData.reduce((acc, cur) => acc + cur) / this.xpData.length;
}

module.exports = Character;