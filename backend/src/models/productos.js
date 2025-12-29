module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },

    precio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    }


  }, {
    tableName: 'productos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Por ahora sin relaciones
  Producto.associate = function(models) {
    // futuras relaciones aquí
  };

  return Producto;
};
