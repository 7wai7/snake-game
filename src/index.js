import http from 'http';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import initSocket from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);



app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Маршрути
app.use("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../", "/public", "index.html"));
});


initSocket(server);

server.listen(PORT, () => {
    console.log(`Server running`);
});