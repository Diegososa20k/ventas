// routes/descargas.js
const express = require('express');
const router = express.Router();
const { Descarga } = require('../models');

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');



// router.post('/', async (req, res) => {
//   try {
//     const { nombre, youtube_url, formato } = req.body;

//     const descarga = await Descarga.create({
//       nombre,
//       youtube_url,
//       formato
//     });

//     // aquí luego va la lógica real de descarga
//     // (ytdlp, ffmpeg, etc)

//     res.json({
//       ok: true,
//       descarga
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Error al crear descarga' });
//   }
// });


router.post('/', async (req, res) => {
  try {
    const { nombre, youtube_url, formato } = req.body;

    const descarga = await Descarga.create({
      nombre,
      youtube_url,
      formato,
      estado: 'pendiente'
    });

    console.log('📥 Nueva descarga:', nombre);

    // Rutas
    const basePath = path.join(__dirname, '../../downloads');

    // MP3
    if (formato === 'mp3' || formato === 'ambas') {
      const salidaMp3 = path.join(basePath, 'mp3', `${nombre}.mp3`);

      const cmdMp3 = `yt-dlp --js-runtimes node -x --audio-format mp3 -o "${salidaMp3}" "${youtube_url}"`;

      console.log('🎵 Ejecutando:', cmdMp3);

      exec(cmdMp3, async (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error MP3:', error);
          await descarga.update({ estado: 'error' });
          return;
        }

        console.log('✅ MP3 descargado');
        await descarga.update({
          archivo_mp3: `${nombre}.mp3`,
          estado: 'completado'
        });
      });
    }

    // MP4
    if (formato === 'mp4' || formato === 'ambas') {
      const salidaMp4 = path.join(basePath, 'mp4', `${nombre}.mp4`);

      const cmdMp4 = `yt-dlp --js-runtimes node -f mp4 -o "${salidaMp4}" "${youtube_url}"`;


      console.log('🎬 Ejecutando:', cmdMp4);

      exec(cmdMp4, async (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error MP4:', error);
          await descarga.update({ estado: 'error' });
          return;
        }

        console.log('✅ MP4 descargado');
        await descarga.update({
          archivo_mp4: `${nombre}.mp4`,
          estado: 'completado'
        });
      });
    }

    // RESPONDEMOS DE UNA VEZ (descarga es async)
    res.json({
      ok: true,
      mensaje: 'Descarga iniciada',
      descarga
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear descarga' });
  }
});



router.get('/', async (req, res) => {
  const descargas = await Descarga.findAll({
    order: [['createdAt', 'DESC']]
  });
  res.json(descargas);
});


router.get('/media/:tipo', async (req, res) => {
  const { tipo } = req.params;

  let where = {};

  if (tipo === 'musica') {
    where.archivo_mp3 = { [require('sequelize').Op.ne]: null };
  }

  if (tipo === 'video') {
    where.archivo_mp4 = { [require('sequelize').Op.ne]: null };
  }

  const archivos = await Descarga.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });

  res.json(archivos);
});

//Eliminar cancion o lo que sea


router.delete('/:id', async (req, res) => {
  try {
    const descarga = await Descarga.findByPk(req.params.id);
    if (!descarga) {
      return res.status(404).json({ error: 'No existe' });
    }

    // borrar archivo físico
    if (descarga.archivo_mp3) {
      const rutaMp3 = path.join(__dirname, '../../downloads/mp3', descarga.archivo_mp3);
      if (fs.existsSync(rutaMp3)) fs.unlinkSync(rutaMp3);
    }

    if (descarga.archivo_mp4) {
      const rutaMp4 = path.join(__dirname, '../../downloads/mp4', descarga.archivo_mp4);
      if (fs.existsSync(rutaMp4)) fs.unlinkSync(rutaMp4);
    }

    await descarga.destroy();

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});


module.exports = router;
