const blessed = require('blessed');
const contrib = require('blessed-contrib');
const Character = require('./character');

/**
 * Initialize the terminal interface.
 * @param {Object} screenOptions options for the blessed screen
 */
function TerminalInterface(screenOptions={}) {
  this.screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    title: 'Terminal Client for Adventure Land',
    ...screenOptions,
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
    6, 6,
    contrib.line, 
    { showNthLabel: 5,
      label: 'Damage',
      showLegend: true,
      legend: { width: 10 } }
  );

  this.screen.key([ 'escape', 'q', 'C-c' ], () => process.exit(0));

  this.screen.on('resize', () => {
    this.damageLine.emit('attach');
  });

  this.screen.render();
}

/**
 * Set the status update data.
 * @param {Character} character
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

module.exports = TerminalInterface;