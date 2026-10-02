import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Global CORS middleware - allows PWABuilder, store packagers, and external tools to fetch manifest, sw, icons
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Body parsers with generous limits for uploads & base64
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Dedicated PWA Manifest endpoints (both .json and .webmanifest for full PWABuilder & browser compatibility)
  const serveManifest = (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

    const publicPath = path.resolve(__dirname, 'public/manifest.json');
    const distPath = path.resolve(__dirname, 'dist/manifest.json');
    const targetFile = fs.existsSync(publicPath) ? publicPath : distPath;
    res.sendFile(targetFile);
  };

  app.get('/manifest.json', serveManifest);
  app.get('/manifest.webmanifest', serveManifest);

  // Dedicated Service Worker endpoints
  const serveServiceWorker = (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

    const publicSw = path.resolve(__dirname, 'public/sw.js');
    const distSw = path.resolve(__dirname, 'dist/sw.js');
    const targetFile = fs.existsSync(publicSw) ? publicSw : distSw;
    res.sendFile(targetFile);
  };

  app.get('/sw.js', serveServiceWorker);
  app.get('/registerSW.js', serveServiceWorker);

  // Dedicated direct icon download endpoint for PWABuilder upload
  app.get('/download-icon', (req, res) => {
    const iconPath = path.resolve(__dirname, 'public/pwa-512x512.png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="streamvibe-icon-512x512.png"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(iconPath);
  });

  // Dedicated visual icon page
  app.get(['/icon', '/icon.html'], (req, res) => {
    const htmlPath = path.resolve(__dirname, 'public/icon.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(htmlPath);
  });

  // Serve thumbnails
  app.use('/thumbnails', express.static(path.resolve(__dirname, 'public/thumbnails'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));

  // Serve public videos with static and range-request support
  app.use('/videos', express.static(path.resolve(__dirname, 'public/videos'), {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (filePath.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      } else if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      }
      res.setHeader('Accept-Ranges', 'bytes');
    },
  }));

  // Serve static public directory (PWA manifest, icons, screenshots, service worker)
  app.use(express.static(path.resolve(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (filePath.endsWith('manifest.json') || filePath.endsWith('manifest.webmanifest')) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      } else if (filePath.endsWith('sw.js')) {
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    }
  }));

  // Mount API router
  app.use('/api', apiRouter);

  if (!isProduction) {
    // Development mode: use Vite dev middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: serve static built assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (filePath.endsWith('manifest.json') || filePath.endsWith('manifest.webmanifest')) {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
        } else if (filePath.endsWith('sw.js')) {
          res.setHeader('Service-Worker-Allowed', '/');
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
      }
    }));

    // Fallback to index.html for SPA routes
    app.get('*', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 StreamVibe server running on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
