const isString = str => typeof str === 'string';
const isNumber = num => typeof num === 'number';
const isBoolean = bool => typeof bool === 'boolean';
const isObject = obj => typeof obj === 'object';
const isArray = arr => Array.isArray(arr);
const isEmptyString = str => str === '';

/**
 * Return a promise of the function's exection in a try/catch block.
 * @param {Function} fn function to try/catch
 * @param {...any} args args to apply to the function, optional
 * @returns {Promise} a promise that resolves the function's return value or rejects the caught exception
 */
async function tryTo(fn, ...args) {
  return new Promise((resolve, reject) => {
    try {
      resolve(fn.apply(null, args));
    } catch (e) {
      reject(e)
    }
  });
}

/**
 * Prints the error and exits the program if `exit` is set to `true`.
 * @param {String|Error} error error to log
 * @param {Boolean} exit whether or not to exit the program, default: `false`
 */
function handleError(error, exit=false) {
  if (error) {
    // TODO: log error in a file (maybe?)
    console.error(error instanceof Error ? error.message : error);
  }
  // non-zero exit
  if (exit) process.exit(1);
}

/**
 * Validates (mostly typechecks) the user's configurations.
 * @param {Object} config the user's configurations
 * @returns {Promise} a promise that doesn't resolve anything and rejects with an error message
 */
async function validateConfig(config) {
  return new Promise((resolve, reject) => {
    if (!isString(config.email) || isEmptyString(config.email)) {
      reject('Must specify an email address in the config file');
    }
    if (!isString(config.password) || isEmptyString(config.password)) {
      reject('Must specify a password in the config file');
    }
    if (!isArray(config.active)) {
      reject('Config file must have an array property \'active\'');
    }
    if (config.active.length === 0) {
      reject('Must at least specify one active character in the config file');
    }
    if (config.active.length > 4) {
      reject('Maximum allowed number of active characters is 4');
    }
    if (!config.active.every(c => isObject(c))) {
      reject('Every element in the array property \'active\' must be an object');
    }
    if (!config.active.every(c => 
      isString(c.name) && !isEmptyString(c.name) &&
      isString(c.region) && !isEmptyString(c.region) &&
      isString(c.server) && !isEmptyString(c.server) &&
      (isString(c.script) || !c.script))) {
        reject('Type error in one of your active characters');
    }

    // config file seems to be valid
    resolve();
  });
}

module.exports = {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isEmptyString,
  tryTo,
  handleError,
  validateConfig,
};