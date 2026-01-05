module.exports = (sequelize, DataTypes) => {
  const Playlist = sequelize.define('Playlist', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    favorito: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'playlists',
    timestamps: true
  });

  // 👇 RELACIONES
  Playlist.associate = function(models) {
    Playlist.belongsToMany(models.Descarga, {
      through: models.PlaylistCancion,
      foreignKey: 'playlist_id',
      otherKey: 'descarga_id',
      as: 'canciones'
    });
  };

  return Playlist;
};
