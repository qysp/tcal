NOTE: This project is WIP.

# TCAL
**T**erminal **C**lient for [**A**dventure **L**and](https://adventure.land).

## Requirements
* Adventure Land Account
* Node.js (and a package manager)

## Getting started
1. set your email address and password as well as your active characters in the `config.example.js`
2. rename `config.example.js` to `config.js`
3. install the necessary dependencies with the package manager of your choice, e.g. with NPM `npm install`
4. finally, run `node index.js` to start the client

## Start parameters
* --fetch: fetch your characters and the available servers. Overwrites existing character/server JSON files in the `data` folder.

## Config typings
```ts
interface Config {
  email: string;
  password: string;

  active: Array<ActiveCharacter>;
}

interface ActiveCharacter {
  name: string;
  region: string;
  server: string;
  script: string | undefined | null;
};
```