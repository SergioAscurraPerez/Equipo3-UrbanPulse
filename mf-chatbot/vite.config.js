import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const MF_AUTH_URL = isProduction
    ? 'https://equipo3-urban-pulse-auth.vercel.app/remoteEntry.js'
    : 'http://localhost:5177/remoteEntry.js';

  return {
    plugins: [
      react(),
      federation({
        name: 'mf_chatbot',
        filename: 'remoteEntry.js',
        // Consume el microfrontend de autenticación
        remotes: {
          mf_auth: {
            type: 'module',
            name: 'mf_auth',
            entry: MF_AUTH_URL,
          },
        },
        // Sigue exponiendo el chatbot hacia el Host principal
        exposes: {
          './Chatbot': './src/NLQCommandCenter.jsx',
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
          'react/jsx-runtime': { singleton: true },
          'react/jsx-dev-runtime': { singleton: true },
        },
        dts: false,
      }),
    ],
    envPrefix: ['VITE_', 'TE_'],
    server: {
      port: 3003,
      cors: true, // ✨ NUEVO: Permite al Host leer los archivos en modo dev
    },
    // ✨ NUEVO: Obligatorio para que Module Federation genere los módulos correctamente
    build: {
      target: 'esnext',
    },
    // ✨ NUEVO: Asegura que npm run preview use el puerto 3003 y permita conexiones
    preview: {
      port: 3003,
      strictPort: true,
      cors: true,
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  };
});