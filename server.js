const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.wasm': 'application/wasm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') {
        reqPath = '/index.html';
    }

    // Clean leading slash
    const cleanPath = reqPath.replace(/^\/+/, '');
    const strippedBuild = cleanPath.replace(/^build\/resources\//, '');

    const candidates = [
        path.join(ROOT, cleanPath),
        path.join(ROOT, strippedBuild),
        path.join(ROOT, 'build', 'resources', cleanPath),
        path.join(ROOT, 'build', 'resources', strippedBuild),
        path.join(ROOT, 'assets', cleanPath),
        path.join(ROOT, 'assets', strippedBuild),
        path.join(ROOT, 'animate', cleanPath),
        path.join(ROOT, 'animate', strippedBuild),
        path.join(ROOT, 'build_configurations', 'default', cleanPath),
        path.join(ROOT, 'build_configurations', 'default', strippedBuild)
    ];

    let foundFile = null;
    for (const c of candidates) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) {
            foundFile = c;
            break;
        }
    }

    if (foundFile) {
        const ext = path.extname(foundFile).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(foundFile);
        stream.pipe(res);
        console.log(`[200] ${req.url} -> ${path.relative(ROOT, foundFile)}`);
    } else {
        console.warn(`[404] ${req.url}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${req.url}`);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` Plinko Node Server running at http://localhost:${PORT}/`);
    console.log(`=======================================================`);
});
