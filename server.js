const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
    key: fs.readFileSync('/app/certs/key.pem'),
    cert: fs.readFileSync('/app/certs/cert.pem')
};

const server = https.createServer(options, (req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    console.log('Demande:', req.url, '-> Chemin:', filePath);

    const extname = path.extname(filePath);
    let contentType = 'text/html';

    if (extname === '.js') contentType = 'application/javascript';
    if (extname === '.css') contentType = 'text/css';
    if (extname === '.png') contentType = 'image/png';
    if (extname === '.jpg') contentType = 'image/jpeg';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log('Erreur:', err.message);
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
        res.end(data);
    });
});

server.listen(3001, () => {
    console.log('Serveur HTTPS lancé sur https://localhost:3001');
});