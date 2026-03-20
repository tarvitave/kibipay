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
    rollupOptions: {
      output: {
        manualChunks: {
          solana: ['@solana/web3.js'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@solana/web3.js', 'bip39', 'tweetnacl'],
  },
});
