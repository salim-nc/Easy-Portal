const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url);
    
    if (filePath.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
    }
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    if (extname === '.js') contentType = 'application/javascript';
    if (extname === '.css') contentType = 'text/css';
    if (extname === '.png') contentType = 'image/png';
    if (extname === '.jpg') contentType = 'image/jpeg';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
        res.end(data);
    });
});

server.listen(3001, () => {
    console.log('Serveur lancé sur http://localhost:3001');
});