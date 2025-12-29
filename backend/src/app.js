const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS (temporal, luego se puede quitar)
app.use(cors());

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend AngularJS
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.use('/productos', require('./routes/productos'));
app.use('/descargas', require('./routes/descargas'));
app.use('/playlists', require('./routes/playlists'));



// Servir archivos descargados
app.use('/media', express.static(path.join(__dirname, '../downloads')));

// Catch-all SPA (EXPRESS 5 COMPATIBLE)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
