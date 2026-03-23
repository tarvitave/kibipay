import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: './tailwind.config.cjs' }),
        autoprefixer(),
      ],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['@solana/web3.js', 'bip39', 'tweetnacl', 'buffer'],
  },
  define: {
    // Some deps (cipher-base, hash.js) reference the Node `global` object
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      process: 'process/browser',
    },
  },
});
