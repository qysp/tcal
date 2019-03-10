const blessed = require('blessed');
const contrib = require('blessed-contrib');
const Character = require('./character');

/**
 * Initialize the terminal interface.
 */
function TerminalInterface() {
  this.screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    title: 'Terminal Client for Adventure Land',
  });

  this.damageData = [];
  this.damageColors = [
    'red',
    'yellow',
    'blue',
  ];

  this.grid = new contrib.grid({
    rows: 6,
    cols: 6,
    screen: this.screen,
  });

  this.damageLine = this.grid.set(
    // row, col
    0, 0,
    // rowSpan, colSpan
    6, 5,
    contrib.line, 
    { showNthLabel: 5,
      label: 'Damage',
      showLegend: true,
      legend: { width: 10 } }
  );

  this.gameLog = this.grid.set(
    0, 5,
    6, 1,
    contrib.log,
    { fg: "white",
    selectedFg: "white",
    label: 'Game Log' }
  );

  this.screen.key([ 'escape', 'q', 'C-c' ], () => process.exit(0));

  this.screen.on('resize', () => {
    this.damageLine.emit('attach');
    this.gameLog.emit('attach');
  });

  this.screen.render();
}

/**
 * Set the status update data.
 * @param {Character} character character object with the processed data
 */
TerminalInterface.prototype.setData = function(character) {
  if (!this.screen) {
    throw new Error('The interface has to be initialized before setting data');
  }

  const dmgIdx = this.damageData
    .findIndex(elem => elem.id === character.id);

  if (dmgIdx === -1) {
    this.damageData.push({
      id: character.id,
      title: character.name,
      x: [...Array(character.damageData.length).keys()],
      y: character.damageData,
      style: { line: this.damageColors.pop() },
    });
  } else {
    Object.assign(this.damageData[dmgIdx], {
      x: [...Array(character.damageData.length).keys()],
      y: character.damageData
    });
  }

  this.damageLine.setData(this.damageData);

  this.screen.render();
}

TerminalInterface.prototype.log = function(message, character) {
  this.gameLog.log(`[${character ? character : 'GENERAL'}] ${message}`);
}

module.exports = TerminalInterface;