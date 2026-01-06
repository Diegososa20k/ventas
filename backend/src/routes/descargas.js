const express = require('express');
const router = express.Router();
const { Descarga } = require('../models');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

router.post('/', async (req, res) => {
  try {
    const { nombre, youtube_url, formato } = req.body;

    const descarga = await Descarga.create({
      nombre,
      youtube_url,
      formato,
      estado: 'pendiente',
      progreso: 0
    });

    console.log('📥 Nueva descarga:', nombre);

    const io = req.app.get('io');
    const basePath = path.join(__dirname, '../../downloads');

    // Función para descargar MP3 con progreso
    const descargarMP3 = () => {
      return new Promise((resolve, reject) => {
        const salidaMp3 = path.join(basePath, 'mp3', `${nombre}.mp3`);
        
        const args = [
          '--js-runtimes', 'node',
          '-x',
          '--audio-format', 'mp3',
          '--no-playlist',      // Solo descargar un video
          '--progress',         // 👈 Output más limpio
          '--newline',
          '-o', salidaMp3,
          youtube_url
        ];

        const proceso = spawn('yt-dlp', args);
        let totalItems = 1;
        let itemActual = 1;
        let progresoActual = 0;

        proceso.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('📊 MP3:', output);
          
          // 🔴 IGNORAR fragmentos completamente
          if (output.match(/\[download\]\s+Downloading fragment/)) {
            return; // No hacer nada con fragmentos
          }
          
          // ✅ Detectar items de playlist REALES (no fragmentos)
          const matchPlaylist = output.match(/\[download\]\s+Downloading item (\d+) of (\d+)/);
          if (matchPlaylist) {
            itemActual = parseInt(matchPlaylist[1]);
            totalItems = parseInt(matchPlaylist[2]);
            console.log(`📋 Playlist real detectada: ${itemActual}/${totalItems}`);
            
            // Calcular progreso basado en items de playlist
            progresoActual = ((itemActual - 1) / totalItems) * 100;
            
            io.emit('descarga-progreso', {
              id: descarga.id,
              nombre: descarga.nombre,
              formato: 'mp3',
              progreso: progresoActual,
              estado: 'descargando',
              itemActual: itemActual,
              totalItems: totalItems,
              progresoItem: 0
            });

            descarga.update({ progreso: progresoActual, estado: 'descargando' });
          }
          
          // ✅ Parsear progreso porcentual (más confiable)
          const matchDownload = output.match(/\[download\]\s+(\d+\.?\d*)%/);
          if (matchDownload) {
            const progresoVideo = parseFloat(matchDownload[1]);
            
            // Si es playlist REAL (no fragmentos), ajustar el progreso
            if (totalItems > 1) {
              // Progreso = (items completados + progreso del actual) / total
              progresoActual = ((itemActual - 1 + progresoVideo / 100) / totalItems) * 100;
            } else {
              // Para un solo video, usar progreso directo
              progresoActual = progresoVideo;
            }
            
            io.emit('descarga-progreso', {
              id: descarga.id,
              nombre: descarga.nombre,
              formato: 'mp3',
              progreso: progresoActual,
              estado: 'descargando',
              itemActual: itemActual,
              totalItems: totalItems,
              progresoItem: progresoVideo
            });

            descarga.update({ progreso: progresoActual, estado: 'descargando' });
          }
        });

        proceso.stderr.on('data', (data) => {
          const output = data.toString();
          console.log('ℹ️ MP3 Info:', output);
        });

        proceso.on('close', (code) => {
          if (code === 0) {
            console.log('✅ MP3 descargado completamente');
            descarga.update({
              archivo_mp3: `${nombre}.mp3`,
              estado: 'completado',
              progreso: 100
            });

            io.emit('descarga-completada', {
              id: descarga.id,
              nombre: descarga.nombre,
              formato: 'mp3',
              estado: 'completado'
            });

            resolve();
          } else {
            console.error('❌ Error MP3, código:', code);
            descarga.update({ estado: 'error', progreso: 0 });
            
            io.emit('descarga-error', {
              id: descarga.id,
              nombre: descarga.nombre,
              formato: 'mp3',
              error: 'Error en la descarga'
            });

            reject(new Error('Error en descarga MP3'));
          }
        });
      });
    };

    // Función para descargar MP4 con progreso
    const descargarMP4 = () => {
      return new Promise((resolve, reject) => {
        const salidaMp4 = path.join(basePath, 'mp4', `${nombre}.mp4`);
        
        const args = [
          '--js-runtimes', 'node',
          '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          '--no-playlist',      // Solo descargar un video
          '--progress',         // 👈 Output más limpio
          '--newline',
          '-o', salidaMp4,
          youtube_url
        ];

        const proceso = spawn('yt-dlp', args);
        let totalItems = 1;
        let itemActual = 1;
        let progresoActual = 0;

        proceso.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('📊 MP4:', output);
          
          // 🔴 IGNORAR fragmentos completamente
          if (output.match(/\[download\]\s+Downloading fragment/)) {
            return; // No hacer nada con fragmentos
          }
          
          // ✅ Detectar items de playlist REALES
          const matchPlaylist = output.match(/\[download\]\s+Downloading item (\d+) of (\d+)/);
          if (matchPlaylist) {
            itemActual = parseInt(matchPlaylist[1]);
            totalItems = parseInt(matchPlaylist[2]);
            console.log(`📋 Playlist real detectada: ${itemActual}/${totalItems}`);
            
            progresoActual = ((itemActual - 1) / totalItems) * 100;
            
            io.emit('descarga-progreso', {
              id: descarga.id,
              nombre: descarga.nombre,
              formato: 'mp4',
              progreso: progresoActual,
              estado: 'descargando',
              itemActual: itemActual,
              totalItems: totalItems,
              progresoItem: 0
            });

            descarga.update({ progreso: progresoActual, estado: 'descargando' });
          }
          
          // ✅ Parsear progreso porcentual
          const matchDownload = output.match(/\[download\]\s+(\d+\.?\d*)%/);
          if (matchDownload) {
            const progresoVideo = parseFloat(matchDownload[1]);
            
            if (totalItems > 1) {
              progresoActual = ((itemActual - 1 + progresoVideo / 100) / totalItems) * 100;
            } else {
              progresoActual = progresoVideo;
            }
            
            io.emit('descarga-progreso', {
              id: descarga.id,
              nombre: descarga.nombre,
              formato: 'mp4',
              progreso: progresoActual,
              estado: 'descargando',
              itemActual: itemActual,
              totalItems: totalItems,
              progresoItem: progresoVideo
            });

            descarga.update({ progreso: progresoActual, estado: 'descargando' });
          }
        });

        proceso.stderr.on('data', (data) => {
          console.log('ℹ️ MP4 Info:', data.toString());
        });

        proceso.on('close', (code) => {
          if (code === 0) {
            console.log('✅ MP4 descargado completamente');
            descarga.update({
              archivo_mp4: `${nombre}.mp4`,
              estado: 'completado',
              progreso: 100
            });

            io.emit('descarga-completada', {
              id: descarga.id,
              nombre: descarga.nombre,
              formato: 'mp4',
              estado: 'completado'
            });

            resolve();
          } else {
            console.error('❌ Error MP4, código:', code);
            descarga.update({ estado: 'error', progreso: 0 });
            
            io.emit('descarga-error', {
              id: descarga.id,
              nombre: descarga.nombre,
              formato: 'mp4',
              error: 'Error en la descarga'
            });

            reject(new Error('Error en descarga MP4'));
          }
        });
      });
    };

    // Ejecutar descargas según formato
    if (formato === 'mp3') {
      descargarMP3().catch(console.error);
    } else if (formato === 'mp4') {
      descargarMP4().catch(console.error);
    } else if (formato === 'ambas') {
      descargarMP3()
        .then(() => descargarMP4())
        .catch(console.error);
    }

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

router.delete('/:id', async (req, res) => {
  try {
    const descarga = await Descarga.findByPk(req.params.id);
    if (!descarga) {
      return res.status(404).json({ error: 'No existe' });
    }

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