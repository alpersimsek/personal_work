import 'dotenv/config';
import knexLib from 'knex';

async function main(): Promise<void> {
  const rootDb = knexLib({
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: 'root',
      password: process.env.DB_ROOT_PASSWORD,
    },
  });

  const testDbName = `${process.env.DB_NAME}_test`;
  await rootDb.raw(`DROP DATABASE IF EXISTS \`${testDbName}\``);
  await rootDb.raw(`CREATE DATABASE \`${testDbName}\``);
  // The docker-compose MariaDB image only grants DB_USER access to
  // DB_NAME (via MARIADB_DATABASE) on first boot, not to a database
  // created afterwards. Grant access to the freshly created test
  // database so the app user (used by knex.ts) can connect to it.
  await rootDb.raw(
    `GRANT ALL PRIVILEGES ON \`${testDbName}\`.* TO '${process.env.DB_USER}'@'%'`
  );
  await rootDb.raw('FLUSH PRIVILEGES');
  await rootDb.destroy();

  const { db } = await import('./knex.js');
  await db.migrate.latest();
  await db.seed.run();
  await db.destroy();
  console.log('Test database reset complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
