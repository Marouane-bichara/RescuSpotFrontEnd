import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const uploadsDir = path.join(projectRoot, 'public', 'uploads', 'animals');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const port = 8090;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, statusCode, data) {
  setCors(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function serveUploadedFile(req, res) {
  const filePath = req.url.replace('/uploads/animals/', '');
  const fullPath = path.join(uploadsDir, filePath);

  if (!fullPath.startsWith(uploadsDir)) {
    sendJson(res, 400, { message: 'Invalid file path.' });
    return;
  }

  if (!fs.existsSync(fullPath)) {
    sendJson(res, 404, { message: 'File not found.' });
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentTypeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };

  setCors(res);
  res.writeHead(200, { 'Content-Type': contentTypeMap[ext] || 'application/octet-stream' });
  fs.createReadStream(fullPath).pipe(res);
}

function saveAnimalImage(req, res, body) {
  try {
    const payload = JSON.parse(body || '{}');
    const fileName = String(payload.fileName || '').trim();
    const dataUrl = String(payload.dataUrl || '').trim();

    if (!fileName || !dataUrl.startsWith('data:image/')) {
      sendJson(res, 400, { message: 'Invalid image payload.' });
      return;
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const base64Part = dataUrl.split(',')[1] || '';

    if (!base64Part) {
      sendJson(res, 400, { message: 'Image content is empty.' });
      return;
    }

    const fileBuffer = Buffer.from(base64Part, 'base64');
    const fullPath = path.join(uploadsDir, safeName);

    fs.writeFileSync(fullPath, fileBuffer);

    sendJson(res, 200, {
      message: 'Image saved successfully.',
      path: `/uploads/animals/${safeName}`
    });
  } catch {
    sendJson(res, 500, { message: 'Could not save image.' });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/uploads/animals/')) {
    serveUploadedFile(req, res);
    return;
  }

  if (req.method === 'POST' && req.url === '/upload/animal-image') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => saveAnimalImage(req, res, body));
    req.on('error', () => sendJson(res, 500, { message: 'Upload failed.' }));
    return;
  }

  sendJson(res, 404, { message: 'Route not found.' });
});

server.listen(port, () => {
  console.log(`Local image server running on http://localhost:${port}`);
  console.log(`Images are saved in: ${uploadsDir}`);
});
