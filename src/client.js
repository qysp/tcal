/**
 * Based on and inspired by NexusNull:
 * https://github.com/NexusNull/ALBot/blob/master/httpWrapper.js
 */
const request = require('request-promise-native');
const { handleError, } = require('./helpers');

/**
 * Initialize the Client for Adventure Land and the necessary websocket.
 * @param {Object} config config for the Adventure Land client
 * @param {String} config.email email address for login
 * @param {String} config.password password for login
 * @param {String} config.https whether to use https
 */
const AdventureLandClient = function(config) {
  this.url = `${config.https ? 'https' : 'http'}://adventure.land`;
  this.email = config.email;
  this.password = config.password;
};

/**
 * Try to log in to Adventure Land.
 * On failure exit the program with an error message.
 */
AdventureLandClient.prototype.login = async function() {
  const form = {
    arguments: `{ "email": "${this.email}", "password": "${this.password}", "only_login": true }`,
    method: 'signup_or_login',
  }

  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'AdventureLandTerminalClient: (v1.0.0)',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cache-Control': 'no-cache',
  };

  const options = {
    uri: `${this.url}/api/signup_or_login`,
    form: form,
    headers: headers,
    resolveWithFullResponse: true
  };

  await request
    .post(options)
    .then(res => {
      const success = JSON.parse(res.body).find(elem => elem.message === 'Logged In!') !== undefined;
      if (!success) {
        throw new Error('Error: Login failed');
      }
      // set session (auth) cookie and user id
      this.sessionCookie = res.headers['set-cookie']
        .find(cookie => cookie.startsWith('auth'))
        .split(';')[0]
        .split('=')[1];
      this.userId = this.sessionCookie.split('-')[0];
    })
    .catch(err => handleError(err.message, true));
}


module.exports = AdventureLandClient;