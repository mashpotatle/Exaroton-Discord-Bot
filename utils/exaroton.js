// utils/exaroton.js

const { Client: ExarotonClient } = require('exaroton');
require('dotenv').config();

const exaClient = new ExarotonClient(process.env.EXAROTON_TOKEN);
const server = exaClient.server(process.env.EXAROTON_SERVER_ID);

async function getServer() {
  await server.get();
  return server;
}

async function getWhitelist() {
  const srv = await getServer();
  return srv.getPlayerList('whitelist');
}

async function syncWhitelistFromLocal(localUsernames) {
  const whitelist = await getWhitelist();
  const current = await whitelist.getEntries();

  if (current.length) await whitelist.deleteEntries(current);
  if (localUsernames.length) await whitelist.addEntries(localUsernames);
}

async function addToWhitelist(username) {
  const whitelist = await getWhitelist();
  return whitelist.addEntry(username);
}

async function removeFromWhitelist(username) {
  const whitelist = await getWhitelist();
  return whitelist.deleteEntry(username);
}

async function getCurrentWhitelist() {
  const whitelist = await getWhitelist();
  return whitelist.getEntries();
}

module.exports = {
  getServer,
  getWhitelist,
  syncWhitelistFromLocal,
  addToWhitelist,
  removeFromWhitelist,
  getCurrentWhitelist
};
