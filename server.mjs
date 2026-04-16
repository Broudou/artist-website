import express from 'express';
import { handler as ssrHandler } from './dist/server/entry.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Serve Astro's static client assets
app.use(express.static(path.join(__dirname, 'dist/client')));

// Serve uploaded images from the uploads directory
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// All other requests handled by Astro SSR
app.use(ssrHandler);

const port = parseInt(process.env.PORT || '4321', 10);
app.listen(port, () => {
  console.log(`Artist portfolio server running on http://localhost:${port}`);
});
