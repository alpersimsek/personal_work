import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.API_PORT) || 3001;
const app = createApp({ serveStatic: process.env.NODE_ENV === 'production' });

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
