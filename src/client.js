// Based on and inspired by NexusNull:
// https://github.com/NexusNull/ALBot/blob/master/httpWrapper.js

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
  this.loggedIn = false;
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
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'AdventureLandTerminalClient: (v1.0.0)',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cache-Control': 'no-cache',
  };

  await request
    .post({
      uri: `${this.url}/api/signup_or_login`,
      form: form,
      headers: headers,
      resolveWithFullResponse: true,
    })
    .then(res => {
      const success = JSON.parse(res.body).find(elem => elem.message === 'Logged In!') !== undefined;
      if (!success) {
        throw new Error('Failed to login');
      }
      // set session (auth) cookie and user id
      this.sessionCookie = res.headers['set-cookie']
        .find(cookie => cookie.startsWith('auth'))
        .split(';')[0]
        .split('=')[1];
      this.userId = this.sessionCookie.split('-')[0];
      this.loggedIn = true;
    })
    .catch(err => handleError(err.message, true));
}

/**
 * Fetch the characters of the logged in account.
 * @returns an array of objects where each object represents a character
 */
AdventureLandClient.prototype.getCharacters = async function() {
  if (!this.loggedIn) {
    throw new Error('Must login before fetching characters');
  }

  const form = { method: 'servers_and_characters', };
  const headers = { Cookie: `auth=${this.sessionCookie}`, };

  return await request
    .post({
      uri: `${this.url}/api/servers_and_characters`,
      form: form,
      headers: headers,
    })
    .then(body => {
      const jsonData = JSON.parse(body)[0];
      // only the id and name of each character is needed
      return jsonData.characters
        .map(c => ({ id: c.id, name: c.name }));
    })
    .catch(err => handleError(err.message, true));
}

/**
 * Fetch the available servers.
 * @returns an array of objects where each objects represents a server
 */
AdventureLandClient.prototype.getServers = async function() {
  if (!this.loggedIn) {
    throw new Error('Must login before fetching servers');
  }

  const form = { method: 'get_servers', };
  const headers = { Cookie: `auth=${this.sessionCookie}`, };

  return await request
    .post({
      uri: `${this.url}/api/get_servers`,
      form: form,
      headers: headers,
    })
    .then(body => {
      const jsonData = JSON.parse(body)[0];
      if (jsonData.type !== 'success') {
        throw new Error('Failed fetching server list');
      }
      return jsonData.message;
    })
    .catch(err => handleError(err.message, true));
}

/**
 * Load a file from the public Adventure Land website.
 * @param {String} filepath name of the file's path
 */
AdventureLandClient.prototype.getGameFile = async function(filepath) {
  return await request
    .get(`${this.url}/${filepath}`)
    .catch(err => handleError(err.message));
}

module.exports = AdventureLandClient;