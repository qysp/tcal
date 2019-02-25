// Based on and inspired by NexusNull:
// https://github.com/NexusNull/ALBot/blob/master/httpWrapper.js

// Right now it is very hacky and heavily relies on the correctness of the server's response.
// The goal should be to make this a reliable standalone AL client framework you can build apps on.

const request = require('request-promise-native');

const { handleError, } = require('./helpers');
const { baseUrl, userAgent } = require('./globals')

/**
 * Initialize the Client for Adventure Land and the necessary websocket.
 * @param {Object} config config for the Adventure Land client
 * @param {String} config.email email address for login
 * @param {String} config.password password for login
 */
class AdventureLandClient {
  constructor(config) {
    this.url = baseUrl;
    this.email = config.email;
    this.password = config.password;
    this.loggedIn = false;
  }
};

/**
 * Try to log in to Adventure Land.
 * On failure exit the program with an error message.
 */
AdventureLandClient.prototype.login = async function() {
  const form = {
    arguments: JSON.stringify({
      email: this.email,
      password: this.password,
      only_login: true
    }),
    method: 'signup_or_login',
  };

  const headers = {
    Accept: 'application/json, text/html, */*;q=0.01',
    'User-Agent': userAgent,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  return await request
    .post({
      uri: `${this.url}/api/signup_or_login`,
      form: form,
      headers: headers,
      resolveWithFullResponse: true,
    })
    .then(res => {
      const found = JSON.parse(res.body)
        .find(elem => elem.message === 'Logged In!');

      if (!found) {
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
    .catch(err => handleError(err, true));
}

/**
 * Fetch the characters of the logged in account.
 * @returns {Array} an array of objects where each object represents a character
 */
AdventureLandClient.prototype.getCharacters = async function() {
  if (!this.loggedIn) {
    throw new Error('Must login before fetching characters');
  }

  const form = { method: 'servers_and_characters', };
  const headers = {
    Cookie: `auth=${this.sessionCookie}`,
    Accept: 'application/json, text/html, */*;q=0.01',
    'User-Agent': userAgent,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  return await request
    .post({
      uri: `${this.url}/api/servers_and_characters`,
      form: form,
      headers: headers,
    })
    .then(body => {
      const jsonData = JSON.parse(body)[0];
      return jsonData.characters;
    })
    .catch(err => handleError(err, true));
}

/**
 * Fetch the available servers.
 * @returns {Array} an array of objects where each objects represents a server
 */
AdventureLandClient.prototype.getServers = async function() {
  if (!this.loggedIn) {
    throw new Error('Must login before fetching servers');
  }

  const form = { method: 'get_servers', };
  const headers = {
    Cookie: `auth=${this.sessionCookie}`,
    Accept: 'application/json, text/html, */*;q=0.01',
    'User-Agent': userAgent,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

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
    .catch(err => handleError(err, true));
}

/**
 * Get the user's authentication token.
 * @returns {String|Boolean} user auth on success, `false` on failure
 */
AdventureLandClient.prototype.getUserAuth = async function() {
  if (!this.loggedIn) {
    throw new Error('Must login before fetching user authentication');
  }

  const headers = {
    Cookie: `auth=${this.sessionCookie}`,
    Accept: 'application/json, text/html, */*;q=0.01',
    'User-Agent': userAgent,
  };

  return await request
    .get({
      uri: this.url,
      headers: headers,
    })
    .then(body => {
      const found = /auth\s?=\s?"([a-z0-9]+)"/i.exec(body);
      if (!found) {
        throw new Error('Cannot find user authentication token');
      }
      this.userAuth = found[1];
      return this.userAuth;
    })
    .catch(err => {
      handleError(err);
      return false;
    });
}

/**
 * Create a character.
 * @param {String} name the character's name
 * @param {String} cls the character's class
 * @param {String} gender the character's gender
 * @returns {Boolean} `true` on success, `false` on failure
 */
AdventureLandClient.prototype.createCharacter = async function(name, cls, gender) {
  if (!this.loggedIn) {
    throw new Error('Must login before fetching user authentication');
  }

  const form = {
    arguments: JSON.stringify({ name: name, char: cls, gender: gender }),
    method: 'create_character',
  };

  const headers = {
    Cookie: `auth=${this.sessionCookie}`,
    Accept: 'application/json, text/html, */*;q=0.01',
    'User-Agent': userAgent,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  return await request
    .post({
      uri: `${this.url}/api/create_character`,
      headers: headers,
      form: form,
    })
    .then(body => {
      const jsonData = JSON.parse(body)[0];
      if (jsonData.type !== 'success') {
        throw new Error(jsonData.message || 'Character creation failed');
      }
      return true;
    })
    .catch(err => {
      handleError(err);
      return false;
    });
}

/**
 * Delete a character.
 * @param {String} name the character's name
 * @returns {Boolean} `true` on success, `false` on failure
 */
AdventureLandClient.prototype.deleteCharacter = async function(name) {
  if (!this.loggedIn) {
    throw new Error('Must login before fetching user authentication');
  }

  const form = {
    arguments: JSON.stringify({ name: name }),
    method: 'delete_character',
  };

  const headers = {
    Cookie: `auth=${this.sessionCookie}`,
    Accept: 'application/json, text/html, */*;q=0.01',
    'User-Agent': userAgent,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  return await request
    .post({
      uri: `${this.url}/api/delete_character`,
      headers: headers,
      form: form,
    })
    .then(body => {
      const jsonData = JSON.parse(body)[0];
      if (jsonData.type.endsWith('error')) {
        throw new Error(jsonData.message || 'Character deletion failed');
      }
      return true;
    })
    .catch(err => {
      handleError(err);
      return false;
    });
}

/**
 * Upload and save code to a slot.
 * @param {Number} slot the slot number of the saved code
 * @param {String} slotName the name of the slot
 * @param {String} code the code to upload
 * @returns {Boolean} `true` on success, `false` on failure
 */
AdventureLandClient.prototype.saveCode = async function(slot, slotName, code) {
  if (!this.loggedIn) {
    throw new Error('Must login before fetching user authentication');
  }

  const form = {
    arguments: JSON.stringify({
      slot: slot,
      name: slotName,
      code: code,
    }),
    method: 'save_code',
  };

  const headers = {
    Cookie: `auth=${this.sessionCookie}`,
    Accept: 'application/json, text/html, */*;q=0.01',
    'User-Agent': userAgent,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  return await request
    .post({
      uri: `${this.url}/api/save_code`,
      headers: headers,
      form: form,
    })
    .then(body => {
      const jsonData = JSON.parse(body)[0];
      if (jsonData.type === 'ui_error') {
        throw new Error(jsonData.message || 'Could not save code');
      }
      return true;
    })
    .catch(err => {
      handleError(err);
      return false;
    });
}

/**
 * Load some sort of data from Adventure Land (i.e. HTML, JavaScript files).
 * @param {String} params query parameters or a file's path
 * @param {Boolean} authneeded whether the session cookie should be used for the request
 * @returns {any} the response body
 */
AdventureLandClient.prototype.getData = async function(params, authNeeded=false) {
  const headers = {
    // just accept anything
    Accept: '*/*',
    'User-Agent': userAgent,
  }
  
  if (authNeeded) {
    if (!this.loggedIn) {
      throw new Error('Must login beforehand to use your authentication token');
    }
    Object.assign(headers, { Cookie: `auth=${this.sessionCookie}`, });
  }

  return await request.get({
    uri: `${this.url}/${params}`,
    headers: headers
  });
}

module.exports = AdventureLandClient;