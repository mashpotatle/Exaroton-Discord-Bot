const { Client: ExarotonClient } = require('exaroton');
require('dotenv').config();

const exaClient = new ExarotonClient(process.env.EXAROTON_TOKEN);
const server = exaClient.server(process.env.EXAROTON_SERVER_ID);

module.exports = {
  exaClient,
  server
};
