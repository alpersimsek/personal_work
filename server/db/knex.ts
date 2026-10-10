import knexLib, { type Knex } from 'knex';
import knexConfig from './knexfile.js';

function currentEnvironment(): 'development' | 'test' | 'production' {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  return 'development';
}

export const db = knexLib(knexConfig[currentEnvironment()]);

export function withDbTransaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === 'test' && process.env.SECURITY_TEST_ROLLBACK_ONLY === '1') {
    return callback(db as unknown as Knex.Transaction);
  }
  return db.transaction(callback);
}
