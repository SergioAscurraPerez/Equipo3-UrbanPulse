import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const PROD_REMOTE_MF_DASHBOARD_URL = 'https://equipo3-urban-pulse-jti7.vercel.app/remoteEntry.js';
const PROD_REMOTE_MF_MAPA_URBANO_URL = 'https://equipo3-urban-pulse-e9i8.vercel.app/remoteEntry.js';
const PROD_REMOTE_MF_CHATBOT_URL = 'https://equipo3-urban-pulse-jbf3.vercel.app/remoteEntry.js';
const PROD_REMOTE_MF_GESTION_INCIDENTES_URL = 'https://equipo3-urban-pulse-gestion-inciden.vercel.app//remoteEntry.js';
const PROD_REMOTE_MF_HISTORIAL_REPORTES_URL = 'https://equipo3-urban-pulse-historial-repor.vercel.app//remoteEntry.js';
const PROD_REMOTE_MF_AUTH_URL = 'https://equipo3-urban-pulse-auth.vercel.app//remoteEntry.js';
const PROD_REMOTE_MF_AJUSTES_URL = 'https://equipo3-urban-pulse-ajustes-pi.vercel.app//remoteEntry.js'; 

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      federation({
        name: 'host_urbanpulse',
        remotes: {
          mf_mapa_urbano: {
            type: 'module',
            name: 'mf_mapa_urbano',
            entry: isProduction ? PROD_REMOTE_MF_MAPA_URBANO_URL : 'http://localhost:5174/remoteEntry.js',
          },
          mf_dashboard: {
            type: 'module',
            name: 'mf_dashboard',
            entry: isProduction ? PROD_REMOTE_MF_DASHBOARD_URL : 'http://localhost:5175/remoteEntry.js',
          },
          mf_chatbot: {
            type: 'module',
            name: 'mf_chatbot',
            entry: isProduction ? PROD_REMOTE_MF_CHATBOT_URL : 'http://localhost:3003/remoteEntry.js', 
          },
          mf_gestion_incidentes: {
            type: 'module',
            name: 'mf_gestion_incidentes',
            entry: isProduction ? PROD_REMOTE_MF_GESTION_INCIDENTES_URL : 'http://localhost:5173/remoteEntry.js',
          },
          mf_historial_reportes: {
            type: 'module',
            name: 'mf_historial_reportes',
            entry: isProduction ? PROD_REMOTE_MF_HISTORIAL_REPORTES_URL : 'http://localhost:5176/remoteEntry.js',
          },
          mf_auth: {
            type: 'module',
            name: 'mf_auth',
            entry: isProduction ? PROD_REMOTE_MF_AUTH_URL : 'http://localhost:5177/remoteEntry.js',
          },
          mf_ajustes: {
            type: 'module',
            name: 'mf_ajustes',
            entry: isProduction ? PROD_REMOTE_MF_AJUSTES_URL : 'http://localhost:5178/remoteEntry.js', // <-- Microfrontend Ajustes
          },
        },
        shared: {
          'react': { singleton: true },
          'react-dom': { singleton: true },
          'react/jsx-runtime': { singleton: true },
          'react/jsx-dev-runtime': { singleton: true },
          '@tanstack/react-query': { singleton: true },
        },
        dts: false,
      }),
    ],

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime']
    },
    server: {
      port: 3000,
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    build: {
      target: 'esnext',
    },
  };
});