/**
 * ============================================================================
 * LEAN MEAN VPS - Build-Pipeline & Compiler Konfiguration (Vite)
 * ============================================================================
 *
 * DATEI-ZWECK:
 * Diese Datei steuert den gesamten Build-Prozess der Anwendung.
 * Konfiguriert für SSG (Static Site Generation) mit PWA-Support.
 *
 * @author LEAN_MEAN_VPS
 * @version 2.0.0
 * ============================================================================
 */

import tailwindcss from '@tailwindcss/vite';
import ssg from '@hono/vite-ssg';
import honox from 'honox/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // Client-Build für SSG
  const entry = './app/server.ts';

  const pwaPlugin = VitePWA({
    registerType: 'autoUpdate',
    filename: 'sw.js',
    manifest: {
      name: 'LEAN MEAN VPS',
      short_name: 'LeanVPS',
      description: 'Ultra-schlanke Full-Stack App für Low-Resource VPS',
      theme_color: '#10b981',
      background_color: '#0a0a0a',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 5,
            },
            networkTimeoutSeconds: 10,
          },
        },
        {
          urlPattern: /\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: false, // PWA auch im Dev-Modus aktiv
    },
  });

  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: ['./app/client.ts', './app/styles.css'],
          output: {
            entryFileNames: 'static/client.js',
            chunkFileNames: 'static/assets/[name]-[hash].js',
            assetFileNames: 'static/assets/[name].[ext]',
          },
        },
        emptyOutDir: false,
      },
      plugins: [tailwindcss(), pwaPlugin],
    };
  }

  // Server/Dev Build
  return {
    resolve: {
      alias: {
        'bun:sqlite': path.resolve(__dirname, './app/db/bun-sqlite-mock.ts'),
      },
    },
    plugins: [
      honox({
        devServer: {
          entry,
        },
        client: {
          input: ['./app/styles.css'],
        },
      }),
      ssg({ entry }),
      tailwindcss(),
      pwaPlugin,
    ],

    build: {
      minify: 'esbuild',
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },

    ssr: {
      external: ['bun:sqlite'],
    },

    server: {
      // CORS für GitHub Codespaces aktivieren
      cors: true,
      // Host für Codespaces Port-Forwarding
      host: '0.0.0.0',
      hmr: {
        // HMR für Codespaces konfigurieren
        overlay: false,
        // Bei Codespaces muss clientPort auf 443 (HTTPS) gesetzt werden
        clientPort: process.env.CODESPACES ? 443 : undefined,
        // Host automatisch erkennen lassen
        host: undefined,
      },
      // Headers für alle Responses
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-csrf-token',
      },
    },
  };
});
