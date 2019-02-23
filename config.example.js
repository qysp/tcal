/**
 * Change the configurations to your own preferences
 * and rename the file to `config.js`.
 */
module.exports = {
  // your Adventure Land credentials
  email: 'example@email.com',
  password: 'password123',

  // enter the character name, region and server here
  // maximum of 4 entries, where one of them should be a merchant
  active: [
    {
      name: 'character1', // the character name
      server: 'I', // the server name, e.g. `I`, `II`, `III`, `PVP`, etc.
      region: 'US', // the server region, e.g. `EU`, `US`, etc.
      script: 'farm.js' // only the name of the script is required or `undefined` if you don't want to use a script
    },
  ],
};
