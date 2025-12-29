module.exports = (sequelize, DataTypes) => {
  const PlaylistCancion = sequelize.define('PlaylistCancion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    playlist_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    descarga_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'playlist_canciones',
    timestamps: false
  });

  return PlaylistCancion;
};
