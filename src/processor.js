class DataProcessor {
  /**
   * Initialize the data processor.
   * @param {String} id character's id
   * @param {String} name character's name
   * @param {String} cls character's class
   * @param {Number} timeFrame time frame for the X per second calculations
   */
  constructor(id, name, cls) {
    this.id = id;
    this.name = name;
    this.class = cls;
  }
}

/**
 * Process the data from a status update of a subprocess.
 * @param {Object} data the status update
 */
DataProcessor.prototype.processUpdate = function(data) {
  this.level = data.level;
  this.rip = data.rip;
  this.gold = data.gold;
  this.damage = data.damage;
  this.xp = data.xp;
  this.target = data.target;
  this.invSlots = data.items.length;
  this.usedInvSlots = data.items.filter(i => i !== null).length;
  this.items = [];

  // accumulate item's quantity by name/level
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
}

module.exports = DataProcessor;