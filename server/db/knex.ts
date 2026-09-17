import knexLib from 'knex';
import knexConfig from './knexfile.js';

function currentEnvironment(): 'development' | 'test' | 'production' {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  return 'development';
}

export const db = knexLib(knexConfig[currentEnvironment()]);
