import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { createReadStream, existsSync } from 'fs';
import { join, extname } from 'path';

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
};

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'middleware',
  }),
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    plugins: [{
      name: 'serve-uploads',
      configureServer(server) {
        server.middlewares.use('/uploads', (req, res, next) => {
          const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
          const filePath = join(uploadDir, req.url ?? '');
          if (!existsSync(filePath)) return next();
          res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream');
          createReadStream(filePath).pipe(res);
        });
      },
    }],
  },
});
