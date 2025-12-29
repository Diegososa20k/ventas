module.exports = (sequelize, DataTypes) => {
  const Descarga = sequelize.define('Descarga', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    youtube_url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    formato: {
      type: DataTypes.ENUM('mp3', 'mp4', 'ambas'),
      allowNull: false
    },
    archivo_mp3: {
      type: DataTypes.STRING,
      allowNull: true
    },
    archivo_mp4: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'completado', 'error'),
      defaultValue: 'pendiente'
    }
  }, {
    tableName: 'descargas',
    timestamps: true
  });

  // 👇 RELACIONES
  Descarga.associate = function(models) {
    Descarga.belongsToMany(models.Playlist, {
      through: models.PlaylistCancion,
      foreignKey: 'descarga_id',
      otherKey: 'playlist_id',
      as: 'playlists'
    });
  };

  return Descarga;
};
