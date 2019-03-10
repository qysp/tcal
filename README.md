# TCAL
**T**erminal **C**lient for [**A**dventure **L**and](https://adventure.land).

Heavily inspired by [NexusNull's Adventure Land Bot](https://github.com/NexusNull/ALBot).

## Getting started
1. copy `config.example.js` and rename it to `config.js`
2. set your email address and password as well as your active characters in the `config.js`
3. install the necessary dependencies with the package manager of your choice, e.g. with NPM `npm install`
4. finally, run `node index.js` to start the client

## Start parameters
* `--fetch`: fetch your characters and the available servers. Overwrites existing character/server JSON files in the `data` folder.
* `--verbose`: stop suppressing stdout/stderr from subprocesses.
* `--log`: pipe the game log of each active character into its own log file, respectively. Does not append to existing files.
* `--interface`: load up a terminal interface using [Blessed](https://github.com/chjj/blessed) that shows the DPS of your characters. GPS, XPPS and other graphs/stats of your characters coming soon&trade;.

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

## Feature ideas
- [ ] Terminal interface with DPS, GPS, XPPS, nice graphs, etc. (e.g. with [Blessed](https://github.com/chjj/blessed))
- [ ] Log analyzer for an easy overview of killed monsters, loot, etc.

## Known errors
* Annoying 'errors' getting printed in verbose mode, especially `TypeError: Cannot read property 'name/width/...' of null`. Can't figure out where exactly the error is being raised since the printed 'error' is just a huge pile of code and not a real stacktrace.
