'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

const db = {};

/**
 * Determinar ruta de la base de datos
 * - En Electron: AppData del usuario
 * - En desarrollo: carpeta /data
 */
let basePath;

try {
  // Electron (cuando está empaquetado o en desktop)
  const { app } = require('electron');
  basePath = app.getPath('userData');
} catch (error) {
  // Desarrollo normal (node)
  basePath = path.join(__dirname, '../../data');
}

// Asegurar que la carpeta exista
if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(basePath, 'ventas.db'),
  logging: false
});

// Cargar modelos automáticamente
fs.readdirSync(__dirname)
  .filter(file => file !== basename && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
