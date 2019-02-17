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
 * @param {String} error error message to log
 * @param {Boolean} exit whether or not to exit the program, default: `false`
 */
function handleError(error, exit=false) {
  // TODO: log error in a file
  console.error(error);
  // non-zero exit
  if (exit) process.exit(1);
}

module.exports = {
  tryTo,
  handleError,
};