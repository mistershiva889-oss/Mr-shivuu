import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        manifestFilename: 'manifest.json',
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon.svg', 'screenshot-mobile.png', 'screenshot-desktop.png'],
        manifest: {
          id: '/',
          name: 'StreamVibe - Video Streaming',
          short_name: 'StreamVibe',
          description: 'Mobile-first video streaming application with clean in-card player, landscape rotation, and high-definition video playback.',
          theme_color: '#0a0d14',
          background_color: '#0a0d14',
          display: 'standalone',
          display_override: ['standalone', 'window-controls-overlay', 'minimal-ui'],
          orientation: 'any',
          start_url: '/',
          scope: '/',
          lang: 'en',
          dir: 'ltr',
          categories: ['entertainment', 'video', 'multimedia'],
          prefer_related_applications: false,
          launch_handler: {
            client_mode: 'auto',
          },
          shortcuts: [
            {
              name: 'Trending Videos',
              short_name: 'Trending',
              description: 'Watch trending videos',
              url: '/?tab=trending',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Video Feed',
              short_name: 'Feed',
              description: 'Open latest videos',
              url: '/',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Admin Portal',
              short_name: 'Admin',
              description: 'Access StreamVibe Admin Portal',
              url: '/#admin',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
          screenshots: [
            {
              src: '/screenshot-mobile.png',
              sizes: '390x844',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Mobile Video Feed & In-Card Player',
            },
            {
              src: '/screenshot-desktop.png',
              sizes: '800x450',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Full Screen Video Streaming View',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? undefined : {},
    },
  };
});
