# TCAL
**T**erminal **C**lient for [**A**dventure **L**and](https://adventure.land).

---

## Requirements
* Adventure Land Account
* Node.js
* Node package manager, e.g. npm or yarn

## Getting started
1. set your email address and password in the `config.example.js`
2. rename `config.example.js` to `config.js`
3. run `npm install` to install the necessary dependencies
4. finally, run `node index.js` to start the client

## Start parameters
Note: if a necessary file does not exist, it will be loaded even if no corresponding paramater is set.
* --fetch: fetch your characters and the available servers even if they already exist in your `data` folder.
* --nocache: load all game files from the server even if they already exist in your `game_files` folder.