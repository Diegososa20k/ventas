const express = require('express');
const router = express.Router();
const { Playlist, Descarga } = require('../models');


// 👉 Obtener todas las playlists
// 👉 Obtener todas las playlists - ✅ ORDENADAS POR FAVORITO
router.get('/', async (req, res) => {
  const playlists = await Playlist.findAll({
    order: [
      ['favorito', 'DESC'],      // 🆕 Primero las favoritas
      ['createdAt', 'DESC']      // Luego las más recientes
    ]
  });
  res.json(playlists);
});

// 👉 Crear nueva playlist
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

// 👉 Verificar en qué playlists está una canción
router.get('/cancion/:descargaId', async (req, res) => {
  try {
    const { descargaId } = req.params;

    const descarga = await Descarga.findByPk(descargaId, {
      include: {
        model: Playlist,
        as: 'playlists',
        through: { attributes: [] }
      }
    });

    if (!descarga) {
      return res.status(404).json({ error: 'Canción no existe' });
    }

    // Devolver solo los IDs de las playlists
    const playlistIds = descarga.playlists.map(pl => pl.id);
    res.json({ playlistIds });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar playlists' });
  }
});

// 👉 Eliminar canción de playlist
router.delete('/:playlistId/cancion/:descargaId', async (req, res) => {
  try {
    const { playlistId, descargaId } = req.params;

    console.log('🗑️ Eliminando canción:', descargaId, 'de playlist:', playlistId);

    const playlist = await Playlist.findByPk(playlistId);
    if (!playlist) {
      console.log('❌ Playlist no encontrada:', playlistId);
      return res.status(404).json({ error: 'Playlist no existe' });
    }

    const descarga = await Descarga.findByPk(descargaId);
    if (!descarga) {
      console.log('❌ Canción no encontrada:', descargaId);
      return res.status(404).json({ error: 'Canción no existe' });
    }

    // 👇 CAMBIO: usar removeCanciones (plural) en lugar de removeCancione
    await playlist.removeCanciones(descarga);

    console.log('✅ Canción eliminada correctamente de la BD');
    res.json({ ok: true, mensaje: 'Canción eliminada de la playlist' });

  } catch (err) {
    console.error('❌ Error al eliminar canción:', err);
    res.status(500).json({ error: 'Error al eliminar canción de playlist' });
  }
});

// 👉 Eliminar playlist
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const playlist = await Playlist.findByPk(id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no existe' });
    }

    await playlist.destroy();
    res.json({ ok: true, mensaje: 'Playlist eliminada' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar playlist' });
  }
});

// 🆕 Marcar/desmarcar playlist como favorita
router.patch('/:id/favorito', async (req, res) => {
  try {
    const { id } = req.params;
    const { favorito } = req.body;

    const playlist = await Playlist.findByPk(id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no existe' });
    }

    playlist.favorito = favorito;
    await playlist.save();

    console.log('⭐ Playlist', playlist.nombre, '- Favorito:', favorito);
    res.json({ ok: true, playlist });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar favorito' });
  }
});
module.exports = router;
