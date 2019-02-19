/**
 * Return a promise of the function's exection in a try/catch block.
 * @param {Function} fn function to try/catch
 * @param {...any} args args to apply to the function, optional
 * @returns a promise that resolves the function's return value or rejects the caught exception
 */
async function tryTo(fn, ...args) {
  return new Promise(function (resolve, reject) {
    try {
      resolve(fn.apply(null, args));
    } catch (e) {
      reject(e)
    }
  });
}

/**
 * Prints the error and exits the program if `exit` is set to `true`.
 * @param {String} errorMsg error message to log
 * @param {Boolean} exit whether or not to exit the program, default: `false`
 */
function handleError(errorMsg, exit=false) {
  if (errorMsg) {
    // TODO: log error in a file (maybe?)
    console.error(errorMsg);
  }
  // non-zero exit
  if (exit) process.exit(1);
}

/**
 * Compares the old characters (from characters.json) to the newly fetched characters
 * and applies the custom keys/values (i.e. server/region) to the fetched characters.
 * @param {Array} o 'old' array of characters
 * @param {Array} n 'new' arrray of characters
 * @returns the fetched characters array with the previously set server/region
 */
function updateCharacters(o, n) {
  o.forEach(c => {
    // characters might be sorted differently
    const index = n.findIndex(char => char.id === c.id)
    if (index === -1) return;
    Object.keys(c).forEach(key => {
      // set the exisiting keys/values
      if (!n[index][key]) {
        n[index][key] = c[key];
      }
    });
  });
  return n;
}

module.exports = {
  tryTo,
  handleError,
  updateCharacters,
};