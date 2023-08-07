import dotenv from 'dotenv';
import { Client, fetchExchange, cacheExchange } from '@urql/core';

dotenv.config();

export const Backend = (params) => {
  return new Client({
    url: process.env.DIRECTUS_API_URL,
    exchanges: [fetchExchange],
    fetchOptions: () => {
      const token = process.env.DIRECTUS_API_TOKEN;
      return {
        headers: { authorization: token ? `Bearer ${token}` : '' },
      };
    },
  });
}

export const Frontend = (params) => {
  const { 
    exchanges = [fetchExchange, cacheExchange], 
    url = process.env.API_GRAPHQL_URL, 
    token 
  } = params;
  return new Client({
    url,
    exchanges,
    fetchOptions: () => {
      return {
        headers: { authorization: token ? `Bearer ${token}` : '' },
      };
    },
  });
}