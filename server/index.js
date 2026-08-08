import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version;
const port = Number.parseInt(process.env.PORT || '8790', 10);
const displayName = process.env.APP_DISPLAY_NAME || 'EU Stock ár-ellenőrző';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': contentTypes['.json'], 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

function serveStatic(request, response) {
  const requested = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const relative = path.posix.normalize(requested).replace(/^\/+/, '');
  const file = path.resolve(publicRoot, relative);

  if (file !== publicRoot && !file.startsWith(`${publicRoot}${path.sep}`)) {
    json(response, 400, { error: 'Érvénytelen útvonal.' });
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      json(response, error.code === 'ENOENT' ? 404 : 500, { error: 'A fájl nem érhető el.' });
      return;
    }
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=300'
    });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET') {
    json(response, 405, { error: 'Nem támogatott művelet.' });
    return;
  }
  if (request.url === '/api/health') {
    json(response, 200, { ok: true, app: displayName, version });
    return;
  }
  if (request.url === '/api/version') {
    json(response, 200, { version });
    return;
  }
  serveStatic(request, response);
});

server.listen(port, '0.0.0.0', () => {
  process.stdout.write(`${displayName} v${version} elindult a ${port} porton.\n`);
});

function shutdown(signal) {
  process.stdout.write(`${signal}: szabályos leállítás.\n`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
