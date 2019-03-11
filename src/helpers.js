const helpers = {};

helpers.isString = str => typeof str === 'string';
helpers.isNumber = num => typeof num === 'number';
helpers.isBoolean = bool => typeof bool === 'boolean';
helpers.isObject = obj => typeof obj === 'object';
helpers.isFunction = fn => typeof fn === 'function';

/**
 * Return a promise of the function's exection in a try/catch block.
 * @param {function} fn function to try/catch
 * @param {...any} [args] args to apply to the function
 * @returns {Promise<any>} a promise that resolves the function's return value or rejects the caught exception
 */
helpers.tryTo = function (fn, ...args) {
  return new Promise((resolve, reject) => {
    try {
      resolve(fn.apply(null, args));
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Prints the error and exits the program if `exit` is set to `true`.
 * @param {(string|Error)} error error to log
 * @param {boolean} [exit=false] whether or not to exit the program
 */
helpers.handleError = function (error, exit=false) {
  if (error) {
    console.error(error instanceof Error ? error.message : error);
  }
  // non-zero exit
  if (exit) process.exit(1);
}

/**
 * Validates (mostly typechecks) the user's configurations.
 * @param {Object} config user's configurations
 * @param {string} config.email user's email
 * @param {string} config.password user's password
 * @param {Object[]} config.active user's active characters
 * @param {string} config.active[].name active character's name
 * @param {string} config.active[].region active character's region
 * @param {string} config.active[].server active character's server name
 * @param {string} [config.active[].script] active character's script filename
 * @returns {Promise<(string|undefined)>} a Promise that resolves if everything is correctly validated
 */
helpers.validateConfig = function (config) {
  return new Promise((resolve, reject) => {
    if (!isString(config.email) || config.email === '') {
      reject('Must specify an email address in the config file');
    }
    if (!isString(config.password) || config.password === '') {
      reject('Must specify a password in the config file');
    }
    if (!Array.isArray(config.active)) {
      reject('Config file must have an array property \'active\'');
    }
    if (config.active.length === 0) {
      reject('Must at least specify one active character in the config file');
    }
    if (config.active.length > 4) {
      reject('Maximum allowed number of active characters is 4');
    }
    if (config.active.some(c => !isObject(c))) {
      reject('Every element in the array property \'active\' must be an object');
    }
    if (config.active.some(c =>
        !isString(c.name)
        || c.name === ''
        || !isString(c.region)
        || c.region === ''
        || !isString(c.server)
        || c.server === ''
        || !isString(c.script)
        && c.script !== undefined)) {
      reject('Type error in at least one of the properties of your active characters');
    }
    resolve();
  });
}


module.exports = helpers;
