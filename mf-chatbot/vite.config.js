import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'mf_chatbot',
      filename: 'remoteEntry.js',
      exposes: {
        './Chatbot': './src/NLQCommandCenter.jsx',
      },
      shared: ['react', 'react-dom'],
      dts: false, 
    })
  ],
  server: {
    port: 3003,
  }
});