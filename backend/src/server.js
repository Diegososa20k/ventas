const app = require('./app');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const db = require('./models');

const PORT = process.env.PORT || 3000;

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO con CORS
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Hacer que io esté disponible globalmente
app.set('io', io);

// Eventos de Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

db.sequelize.sync({ alter: false }).then(() => {
  console.log('🟢 Base de datos SQLite lista');

  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('🔌 Socket.IO configurado');
  });
});