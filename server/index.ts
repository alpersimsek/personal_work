import 'dotenv/config';
import { createApp } from './app.js';
import { assertJwtConfiguration } from './utils/jwt.js';
import { assertSiteConfiguration } from './seo/site.js';

// Fail at startup, not at the first login, if the signing secret is unusable.
assertJwtConfiguration();
assertSiteConfiguration();

const port = Number(process.env.PORT || process.env.API_PORT) || 3001;
const app = createApp({ serveStatic: process.env.NODE_ENV === 'production' });

const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
app.listen(port, host, () => {
  console.log(`API server listening on port ${port}`);
});
