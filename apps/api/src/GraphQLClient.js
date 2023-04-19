const dotenv = require('dotenv');
const { Client, fetchExchange } = require('@urql/core');

dotenv.config();

const GraphQLClient = new Client({
  url: process.env.DIRECTUS_API_URL,
  exchanges: [fetchExchange],
  fetchOptions: () => {
    const token = process.env.DIRECTUS_API_TOKEN;
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});

module.exports = { GraphQLClient };