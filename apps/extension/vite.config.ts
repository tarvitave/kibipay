import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false, // don't ship source maps in extension package
    rollupOptions: {
      output: {
        // Keep chunk sizes manageable
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
