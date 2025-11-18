import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import EnvironmentPlugin from 'vite-plugin-environment';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  server: {
    open: '/index.html',
  },
  plugins: [
    react(),
    EnvironmentPlugin('all'), // This will make environment variables available
  ],
});
