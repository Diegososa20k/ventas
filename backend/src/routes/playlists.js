const express = require('express');
const router = express.Router();
const { Playlist, Descarga } = require('../models');


// 👉 Obtener todas las playlists
router.get('/', async (req, res) => {
  const playlists = await Playlist.findAll({
    order: [['createdAt', 'DESC']]
  });
  res.json(playlists);
});

// 👉 Crear nueva playlist
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    const playlist = await Playlist.create({ nombre });
    res.json(playlist);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear playlist' });
  }
});



// 👉 Agregar canción a playlist
router.post('/:playlistId/agregar', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { descargaId } = req.body;

    const playlist = await Playlist.findByPk(playlistId);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no existe' });
    }

    const descarga = await Descarga.findByPk(descargaId);
    if (!descarga) {
      return res.status(404).json({ error: 'Canción no existe' });
    }

    // 👇 Sequelize hace el insert en playlist_canciones
    await playlist.addCancione(descarga);

    res.json({ ok: true, mensaje: 'Canción agregada a la playlist' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar canción' });
  }
});


// 👉 Ver canciones de una playlist
router.get('/:id/canciones', async (req, res) => {
  const playlist = await Playlist.findByPk(req.params.id, {
    include: {
      model: Descarga,
      as: 'canciones',
      through: { attributes: [] } // oculta tabla pivote
    }
  });

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist no existe' });
  }

  res.json(playlist.canciones);
});

module.exports = router;
