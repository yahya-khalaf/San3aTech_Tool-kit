import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        inlineWorkboxRuntime: true,
        // Only React routes fall back to the app shell. Every other page
        // (whiteboard, PCB kit, calendar, tools, onboarding…) is its own
        // static HTML and must be loaded from the network.
        navigateFallbackAllowlist: [/^\/$/, /^\/courses(\/|$)/],
        // The PCB kit is a separate app; don't precache it for every visitor.
        globIgnores: ['**/node_modules/**', 'employability/pcb-design-and-manufacturing/**']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'San3a Academy Toolkit',
        short_name: 'San3aToolkit',
        description: 'Courses, tools, and utilities for San3a Academy',
        theme_color: '#CF2027',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    {
      name: 'onboarding-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && (req.url === '/onboarding' || req.url.startsWith('/onboarding?'))) {
            req.url = req.url.replace('/onboarding', '/onboarding/index.html');
          }
          // Serve public/<folder>/index.html for folder URLs (e.g. /whiteboard/,
          // /employability/pcb-design-and-manufacturing/) like Cloudflare does,
          // instead of falling back to the React app.
          if (req.url) {
            const [path, query = ''] = req.url.split('?');
            if (path.length > 1 && path.endsWith('/')) {
              const file = resolve(__dirname, 'public', `.${decodeURIComponent(path)}index.html`);
              if (file.startsWith(resolve(__dirname, 'public')) && existsSync(file)) {
                req.url = `${path}index.html${query ? `?${query}` : ''}`;
              }
            }
          }
          next();
        });
      }
    }
  ],
})
