import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], 
  server: {
     host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:6000',
        changeOrigin: true,
      },
    },
    allowedHosts: ['localhost', '127.0.0.1', 'mjay.local','HTSs-Mac-mini.local', 'htsnas.local','htsnas'],
  },
  preview: {
    port: 4173,
  },
});
