import { logError } from '../../logging/errorLog.js';
import { installShutdownHandlers } from '../../logging/processHandlers.js';

// Child process used by processHandlers.test.ts: aggregate an event, then wait for a signal.
for (let index = 0; index < 3; index += 1) logError('repeated_failure', { category: 'ENOENT' });
installShutdownHandlers(null);
setInterval(() => {}, 1000);
console.log('ready');
