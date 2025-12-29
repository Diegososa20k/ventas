const app = require('./app');
require('dotenv').config();

const db = require('./models');

const PORT = process.env.PORT || 3000;

db.sequelize.sync({ alter: false }).then(() => {
  console.log('🟢 Base de datos SQLite lista');

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
