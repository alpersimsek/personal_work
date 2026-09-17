import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: {
        usePolling: true
      },
      proxy: {
        '/uploads': {
          target: `http://127.0.0.1:${process.env.API_PORT || env.API_PORT || '3001'}`,
          changeOrigin: true,
        },
        '/api': {
          target: `http://127.0.0.1:${process.env.API_PORT || env.API_PORT || '3001'}`,
          changeOrigin: true,
        },
      },
    },
  };
});
