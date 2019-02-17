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

/**
 * Prints the help message to `stdout` and exits the program.
 */
function showHelp() {
  console.info(`{ Terminal Client for Adventure Land }
tip: read through the README.md for more imformation

usage: node index.js [-h] -s SERVER -p PORT

optional parameters:
  -h, --help    show this help message and exit

required parameters:
  -s, --server  specify the server to use for connections
  -p, --port    specify the port to use for connections\n`)
}

module.exports = {
  tryTo,
  handleError,
  showHelp,
};