import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import url from 'url';

// Auto-load .env during development
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // ignore
  }
}

/**
 * Built-in Dev Server Plugin for /api and /v routes
 * Executes serverless TypeScript handlers directly during local `npm run dev`.
 */
function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = url.parse(req.url || '', true);
        const pathname = parsedUrl.pathname || '';

        // Only intercept /api routes and /v/ routes
        if (!pathname.startsWith('/api/') && !pathname.startsWith('/v/')) {
          return next();
        }

        try {
          // Read request body
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const bodyBuffer = Buffer.concat(chunks);
          const bodyString = bodyBuffer.toString('utf8');

          let parsedBody: any = undefined;
          if (bodyString) {
            try {
              parsedBody = JSON.parse(bodyString);
            } catch {
              parsedBody = bodyString;
            }
          }

          // Route matching
          let handlerFile: string | null = null;
          const queryParams: Record<string, any> = { ...parsedUrl.query };

          if (pathname === '/api/upload-url') {
            handlerFile = './api/upload-url.ts';
          } else if (pathname === '/api/images') {
            handlerFile = './api/images.ts';
          } else if (pathname === '/api/auth') {
            handlerFile = './api/auth.ts';
          } else if (pathname.startsWith('/api/v/') || pathname.startsWith('/v/')) {
            handlerFile = './api/v/[key].ts';
            const key = pathname.replace(/^(\/api)?\/v\//, '');
            queryParams.key = decodeURIComponent(key);
          }

          if (!handlerFile) {
            return next();
          }

          // Load TypeScript module dynamically using Vite
          const mod = await server.ssrLoadModule(handlerFile);
          const handler = mod.default;

          // Adapt request & response to Vercel Serverless signature
          const vercelReq: any = req;
          vercelReq.query = queryParams;
          vercelReq.body = parsedBody;

          const vercelRes: any = res;
          vercelRes.status = function (code: number) {
            this.statusCode = code;
            return this;
          };
          vercelRes.json = function (json: any) {
            if (!this.getHeader('Content-Type')) {
              this.setHeader('Content-Type', 'application/json');
            }
            this.end(JSON.stringify(json));
            return this;
          };
          vercelRes.redirect = function (statusOrUrl: number | string, urlStr?: string) {
            const status = typeof statusOrUrl === 'number' ? statusOrUrl : 307;
            const target = typeof statusOrUrl === 'string' ? statusOrUrl : urlStr || '/';
            this.statusCode = status;
            this.setHeader('Location', target);
            this.end();
            return this;
          };

          await handler(vercelReq, vercelRes);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Internal Dev Server Error';
          console.error('[API Dev Error]:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: message }));
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
