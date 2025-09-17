import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:6000',
        changeOrigin: true,
      },
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'mjay.local'
    ]
  },
  preview: {
    port: 4173,
  },
});
