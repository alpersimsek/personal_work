import 'dotenv/config';
import readline from 'node:readline';
import { db } from './knex.js';
import { hashPassword } from '../utils/password.js';
import { adminPasswordProblem } from '../utils/adminPassword.js';

/** Reads a line without echoing it, so the password never lands on screen or in shell history. */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = (rl as unknown as { _writeToOutput: (text: string) => void });
    write._writeToOutput = () => {};
    process.stdout.write(question);
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

/**
 * Changes an existing account's password and signs it out everywhere.
 *
 * The seed only creates a missing admin and never touches an existing one, so
 * this is the way to rotate a password. The new value is read from
 * NEW_ADMIN_PASSWORD, or typed at a hidden prompt if that is unset.
 */
async function main(): Promise<void> {
  const username = (process.env.ADMIN_USERNAME ?? '').trim().toLowerCase();
  if (!username) throw new Error('ADMIN_USERNAME must be set.');

  const user = await db('users').where({ username }).first();
  if (!user) throw new Error(`No user named "${username}". Run the seed first.`);

  const password = process.env.NEW_ADMIN_PASSWORD ?? (await promptHidden(`New password for ${username}: `));
  const problem = adminPasswordProblem(password, username);
  if (problem) throw new Error(problem);

  await db('users')
    .where({ id: user.id })
    .update({ password_hash: await hashPassword(password), session_version: db.raw('session_version + 1') });
  console.log(`Password updated for "${username}". Existing sessions were signed out.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
