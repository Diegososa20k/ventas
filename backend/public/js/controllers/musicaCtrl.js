angular.module('ventasApp')
.controller('musicaCtrl', function(
  $scope,
  $timeout,
  musicaFactory,
  playlistFactory,
  $sce,
  $uibModal
) {
  $scope.currentIndex = -1;
  $scope.repeat = false;
  $scope.duration = 0;
  $scope.currentTime = 0;
  $scope.volume = 1;
  $scope.shuffle = false;
  $scope.queue = [];
  $scope.isPlaying = false;
  $scope.playlistSeleccionadaDelDropdown = null;

  // Referencias a los event listeners para poder removerlos
  let boundListeners = null;
  let isSeeking = false;

  // Función para formatear tiempo (mm:ss)
  $scope.formatTime = function(seconds) {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  // ======== FAVORITOS ========
  $scope.toggleFavorito = function(playlist, $event) {
    $event.stopPropagation();
    
    const nuevoEstado = !playlist.favorito;
    console.log('⭐ Cambiando favorito:', playlist.nombre, '→', nuevoEstado);
    
    playlistFactory.toggleFavorito(playlist.id, nuevoEstado)
      .then(function(res) {
        console.log('✅ Favorito actualizado');
        playlist.favorito = nuevoEstado;
        $scope.cargarPlaylists();
      })
      .catch(function(err) {
        console.error('❌ Error al actualizar favorito:', err);
        alert('Error al marcar como favorito');
      });
  };

  // ======== PLAYER EVENTS ========
  function removePlayerEvents(player) {
    if (!player || !boundListeners) return;
    
    console.log('🗑️ Removiendo eventos anteriores del reproductor');
    
    player.removeEventListener('timeupdate', boundListeners.timeupdate);
    player.removeEventListener('loadedmetadata', boundListeners.loadedmetadata);
    player.removeEventListener('ended', boundListeners.ended);
    player.removeEventListener('play', boundListeners.play);
    player.removeEventListener('pause', boundListeners.pause);
    
    boundListeners = null;
  }

  function bindPlayerEvents(player) {
    if (!player) {
      console.error('❌ Player es null en bindPlayerEvents');
      return;
    }

    removePlayerEvents(player);
    console.log('🎵 Vinculando NUEVOS eventos del reproductor');

    boundListeners = {
      timeupdate: function() {
        if (!isSeeking) {
          $scope.currentTime = player.currentTime;
          $scope.duration = player.duration || 0;
          
          const percentage = $scope.duration > 0 ? ($scope.currentTime / $scope.duration) * 100 : 0;
          const progressFill = document.querySelector('.progress-fill');
          if (progressFill) {
            progressFill.style.width = percentage + '%';
          }
          
          const currentTimeDisplay = document.querySelector('.time-current');
          const durationDisplay = document.querySelector('.time-duration');
          
          if (currentTimeDisplay) {
            currentTimeDisplay.textContent = $scope.formatTime($scope.currentTime);
          }
          if (durationDisplay) {
            durationDisplay.textContent = $scope.formatTime($scope.duration);
          }
          
          if (Math.floor($scope.currentTime) % 5 === 0 && Math.floor($scope.currentTime) !== Math.floor($scope.currentTime - 1)) {
            console.log('⏱️ Tiempo:', $scope.currentTime.toFixed(1), '/', $scope.duration.toFixed(1));
          }
        }
        
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      },
      
      loadedmetadata: function() {
        $scope.$apply(function() {
          $scope.duration = player.duration || 0;
          console.log('📊 Metadata cargada - Duración:', $scope.duration.toFixed(2), 'segundos');
        });
      },
      
      ended: function() {
        $scope.$apply(function() {
          console.log('⏹️ Reproducción terminada');
          $scope.isPlaying = false;
          if ($scope.repeat) {
            console.log('🔁 Repeat activado - reiniciando');
            player.currentTime = 0;
            player.play();
            $scope.isPlaying = true;
          } else {
            console.log('⏭️ Pasando a siguiente canción');
            $scope.siguiente();
          }
        });
      },
      
      play: function() {
        $scope.$apply(function() {
          console.log('▶️ Play event - isPlaying = true');
          $scope.isPlaying = true;
        });
      },
      
      pause: function() {
        $scope.$apply(function() {
          console.log('⏸️ Pause event - isPlaying = false');
          $scope.isPlaying = false;
        });
      }
    };

    player.addEventListener('timeupdate', boundListeners.timeupdate);
    player.addEventListener('loadedmetadata', boundListeners.loadedmetadata);
    player.addEventListener('ended', boundListeners.ended);
    player.addEventListener('play', boundListeners.play);
    player.addEventListener('pause', boundListeners.pause);

    player.volume = $scope.volume;
    console.log('🔊 Volumen inicial establecido:', $scope.volume);
  }

  // ======== CONTROLES DE AUDIO ========
  $scope.changeVolume = function() {
    const player = document.getElementById('player');
    if (player) {
      const newVolume = parseFloat($scope.volume);
      player.volume = newVolume;
      console.log('🔊 Volumen cambiado a:', (newVolume * 100).toFixed(0) + '%');
    } else {
      console.error('❌ No se encontró player en changeVolume');
    }
  };

  $scope.seek = function() {
    const player = document.getElementById('player');
    if (player && !isNaN($scope.currentTime)) {
      const newTime = parseFloat($scope.currentTime);
      player.currentTime = newTime;
      console.log('⏩ Buscando posición:', newTime.toFixed(2), 'segundos');
      
      const currentTimeDisplay = document.querySelector('.time-current');
      if (currentTimeDisplay) {
        currentTimeDisplay.textContent = $scope.formatTime(newTime);
      }
      
      const percentage = $scope.duration > 0 ? (newTime / $scope.duration) * 100 : 0;
      const progressFill = document.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.width = percentage + '%';
      }
    } else {
      console.error('❌ No se pudo hacer seek - player:', !!player, 'currentTime:', $scope.currentTime);
    }
  };

  $scope.startSeeking = function() {
    isSeeking = true;
    console.log('🖱️ Usuario empezó a arrastrar el slider');
  };

  $scope.stopSeeking = function() {
    console.log('🖱️ Usuario soltó el slider - aplicando seek');
    isSeeking = false;
    $scope.seek();
  };

  $scope.onSliderChange = function() {
    if (isSeeking) {
      const percentage = $scope.duration > 0 ? ($scope.currentTime / $scope.duration) * 100 : 0;
      const progressFill = document.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.width = percentage + '%';
      }
      
      const currentTimeDisplay = document.querySelector('.time-current');
      if (currentTimeDisplay) {
        currentTimeDisplay.textContent = $scope.formatTime($scope.currentTime);
      }
      
      console.log('🎚️ Arrastrando slider a:', $scope.currentTime.toFixed(2), 'seg');
    }
  };

  $scope.clickSeek = function($event) {
    if (!$scope.duration) return;
    
    const progressBar = $event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = $event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * $scope.duration;
    
    $scope.currentTime = newTime;
    $scope.seek();
    console.log('🎯 Click en barra:', (percentage * 100).toFixed(1) + '%', '→', newTime.toFixed(2), 'seg');
  };

  // ======== DATOS Y FILTROS ========
  $scope.tipo = 'musica';
  $scope.lista = [];
  $scope.seleccionado = null;
  $scope.playlistSeleccionada = null;
  $scope.playlists = [];
  $scope.playlistsFiltradas = [];
  $scope.buscarPlaylist = '';
  $scope.modoEliminarPlaylist = false;
  $scope.maxChipsVisible = 5;
  $scope.menuPlaylist = null;
  $scope.menuStyle = {};
  $scope.playlistsConCancion = [];

  // ======== SELECCIÓN DE PLAYLISTS ========
  $scope.seleccionarPlaylist = function(playlistId) {
    console.log('🎶 [PLAYLIST] Seleccionada:', playlistId || 'Todas');
    $scope.playlistSeleccionada = playlistId;
    
    if (!playlistId || $scope.playlistsFiltradas.slice(0, $scope.maxChipsVisible).some(function(pl) {
      return pl.id === playlistId;
    })) {
      $scope.playlistSeleccionadaDelDropdown = null;
    }
    
    $scope.cargar();
  };

  $scope.seleccionarPlaylistDelDropdown = function(playlistId) {
    console.log('📋 [DROPDOWN] Seleccionada playlist:', playlistId);
    
    const playlistSeleccionada = $scope.playlistsFiltradas.find(function(pl) {
      return pl.id === playlistId;
    });
    
    if (playlistSeleccionada) {
      $scope.playlistSeleccionadaDelDropdown = {
        id: playlistSeleccionada.id,
        nombre: playlistSeleccionada.nombre,
        favorito: playlistSeleccionada.favorito
      };
      
      $scope.playlistSeleccionada = playlistId;
      $scope.cargar();
      
      console.log('✅ Chip adicional creado:', $scope.playlistSeleccionadaDelDropdown.nombre);
    }
  };

  // ======== CARGAR DATOS ========
  $scope.cargar = function() {
    console.log('📋 [CARGAR] Tipo:', $scope.tipo, '- Playlist:', $scope.playlistSeleccionada || 'Todas');
    
    if ($scope.playlistSeleccionada) {
      playlistFactory.canciones($scope.playlistSeleccionada).then(function(res) {
        $scope.lista = res.data;
        $scope.seleccionado = null;
        console.log('✅ [PLAYLIST FILTRADA]', $scope.lista.length, 'canciones');
      });
    } else {
      musicaFactory.listar($scope.tipo).then(function(res) {
        $scope.lista = res.data;
        $scope.seleccionado = null;
        console.log('✅ [LISTA COMPLETA]', $scope.lista.length, 'items');
      });
    }
  };

  $scope.cargarPlaylists = function() {
    playlistFactory.listar().then(function(res) {
      $scope.playlists = res.data;
      $scope.filtrarPlaylists();
      console.log('✅ Playlists cargadas:', $scope.playlists.length);
    });
  };

  $scope.filtrarPlaylists = function() {
    if (!$scope.buscarPlaylist || $scope.buscarPlaylist.trim() === '') {
      $scope.playlistsFiltradas = $scope.playlists;
    } else {
      const buscar = $scope.buscarPlaylist.toLowerCase();
      $scope.playlistsFiltradas = $scope.playlists.filter(function(pl) {
        return pl.nombre.toLowerCase().indexOf(buscar) !== -1;
      });
    }
    
    if ($scope.playlistSeleccionadaDelDropdown) {
      const sigueEnResultados = $scope.playlistsFiltradas.some(function(pl) {
        return pl.id === $scope.playlistSeleccionadaDelDropdown.id;
      });
      
      if (!sigueEnResultados) {
        console.log('⚠️ Playlist del dropdown ya no está en resultados filtrados');
        $scope.playlistSeleccionadaDelDropdown = null;
      }
    }
    
    console.log('🔍 Playlists filtradas:', $scope.playlistsFiltradas.length);
  };

  // ======== GESTIÓN DE PLAYLISTS ========
  $scope.confirmarEliminarPlaylist = function(playlist) {
    if (!confirm('¿Eliminar la playlist "' + playlist.nombre + '"?\n\nEsto NO eliminará las canciones, solo la playlist.')) {
      return;
    }

    playlistFactory.eliminar(playlist.id)
      .then(function() {
        alert('Playlist eliminada correctamente');
        
        if ($scope.playlistSeleccionada === playlist.id) {
          $scope.playlistSeleccionada = null;
          $scope.cargar();
        }
        
        $scope.cargarPlaylists();
        $scope.modoEliminarPlaylist = false;
      })
      .catch(function(err) {
        console.error('Error al eliminar playlist:', err);
        alert('Error al eliminar la playlist');
      });
  };

  $scope.nuevaPlaylist = function(item) {
    const nombre = prompt('Nombre de la playlist');
    if (!nombre) return;

    playlistFactory.crear(nombre).then(function() {
      alert('Playlist creada');
      $scope.cargarPlaylists();
      $scope.cerrarMenu();
    });
  };

  $scope.agregarAPlaylist = function(cancion, playlist) {
    playlistFactory.agregarCancion(playlist.id, cancion.id)
      .then(function() {
        alert('Canción agregada a la playlist');
        $scope.cerrarMenu();
      })
      .catch(function(err) {
        console.error(err);
        alert('Error al agregar canción');
      });
  };

  // ======== MENÚ CONTEXTUAL ========
  $scope.abrirMenuPlaylist = function(item, $event) {
    $event.stopPropagation();
    $scope.menuPlaylist = item;
    $scope.playlistsConCancion = [];
    
    $scope.cargarPlaylists();
    
    playlistFactory.verificarCancion(item.id).then(function(res) {
      $scope.playlistsConCancion = res.data.playlistIds;
      console.log('✅ Canción está en playlists:', $scope.playlistsConCancion);
    }).catch(function(err) {
      console.error('Error al verificar playlists:', err);
    });

    $scope.menuStyle = {
      top: $event.clientY + 'px',
      left: ($event.clientX - 220) + 'px'
    };
  };

  $scope.estaEnPlaylist = function(playlistId) {
    return $scope.playlistsConCancion.indexOf(playlistId) !== -1;
  };

  $scope.cerrarMenu = function() {
    $scope.menuPlaylist = null;
  };

  $scope.eliminar = function(item) {
    if (!confirm('¿Eliminar "' + item.nombre + '"?')) return;

    musicaFactory.eliminar(item.id).then(function() {
      $scope.cargar();
    });
  };

  // ======== MODAL GESTIONAR PLAYLISTS ========
  $scope.abrirModalGestionarPlaylists = function(cancion) {
    console.log('⚙️ [MODAL] Abriendo modal gestionar playlists para:', cancion.nombre);
    
    // Cerrar menú flotante
    $scope.cerrarMenu();
    
    var modalInstance = $uibModal.open({
      templateUrl: 'views/modales/modal_musica_eliminarplaylist.html',
      controller: 'modalGestionarPlaylistsCtrl',
      size: 'md',
      backdrop: 'static',
      resolve: {
        cancion: function() {
          return cancion;
        },
        playlistsConCancion: function() {
          return playlistFactory.verificarCancion(cancion.id).then(function(res) {
            return res.data.playlistIds;
          });
        },
        playlists: function() {
          return $scope.playlists;
        }
      }
    });

    modalInstance.result.then(function(result) {
      if (result && result.cambios) {
        console.log('✅ Se hicieron cambios, recargando...');
        
        if ($scope.playlistSeleccionada) {
          $scope.cargar();
        }
        
        $scope.cargarPlaylists();
      }
    }, function() {
      console.log('❌ Modal cancelado');
    });
  };

  // ======== REPRODUCCIÓN ========
  $scope.reproducirPorIndice = function(index) {
    if (index < 0 || index >= $scope.lista.length) {
      console.warn('⚠️ Índice fuera de rango:', index);
      return;
    }

    $scope.currentIndex = index;
    const item = $scope.lista[index];
    $scope.seleccionado = item;

    console.log('🎵 Reproduciendo:', item.nombre, '(índice:', index, ')');

    $scope.currentTime = 0;
    $scope.duration = 0;

    if ($scope.tipo === 'musica') {
      $scope.mediaUrl = $sce.trustAsResourceUrl(
        '/media/mp3/' + encodeURIComponent(item.archivo_mp3)
      );
      console.log('🎵 URL MP3:', item.archivo_mp3);
    }

    if ($scope.tipo === 'video') {
      $scope.mediaUrl = $sce.trustAsResourceUrl(
        '/media/mp4/' + encodeURIComponent(item.archivo_mp4)
      );
      console.log('🎬 URL MP4:', item.archivo_mp4);
    }
  };

  $scope.reproducir = function(item) {
    const index = $scope.lista.findIndex(function(i) {
      return i.id === item.id;
    });
    console.log('👆 Click en canción - buscando índice:', index);
    $scope.reproducirPorIndice(index);
  };

  $scope.siguiente = function() {
    console.log('⏭️ Siguiente - índice actual:', $scope.currentIndex);
    if ($scope.currentIndex < $scope.lista.length - 1) {
      $scope.reproducirPorIndice($scope.currentIndex + 1);
    } else if ($scope.repeat) {
      console.log('🔁 Volviendo al inicio por repeat');
      $scope.reproducirPorIndice(0);
    } else {
      console.log('⏹️ Fin de la lista');
    }
  };

  $scope.anterior = function() {
    console.log('⏮️ Anterior - índice actual:', $scope.currentIndex);
    if ($scope.currentIndex > 0) {
      $scope.reproducirPorIndice($scope.currentIndex - 1);
    }
  };

  $scope.toggleRepeat = function() {
    $scope.repeat = !$scope.repeat;
    console.log('🔁 Repeat:', $scope.repeat ? 'ON' : 'OFF');
  };

  $scope.toggleShuffle = function() {
    $scope.shuffle = !$scope.shuffle;
    console.log('🔀 Shuffle:', $scope.shuffle ? 'ON' : 'OFF');
  };

  $scope.togglePlayPause = function() {
    const player = document.getElementById('player');
    if (!player) {
      console.error('❌ No se encontró player en togglePlayPause');
      return;
    }

    if ($scope.isPlaying) {
      console.log('⏸️ Pausando...');
      player.pause();
    } else {
      console.log('▶️ Reproduciendo...');
      player.play().catch(function(error) {
        console.error('❌ Error al reproducir:', error);
      });
    }
  };

  $scope.play = function() {
    const player = document.getElementById('player');
    if (player) {
      player.play().catch(function(error) {
        console.error('Error al reproducir:', error);
      });
    }
  };

  $scope.pause = function() {
    const player = document.getElementById('player');
    if (player) {
      player.pause();
    }
  };

  // ======== WATCH MEDIA URL ========
  let watchCounter = 0;
  $scope.$watch('mediaUrl', function(newVal, oldVal) {
    if (!newVal) return;
    
    watchCounter++;
    console.log('🎬 Watch #' + watchCounter + ' - Cargando nuevo media');

    $timeout(function() {
      const player = document.getElementById('player');
      
      if (!player) {
        console.error('❌ No se encontró el elemento player en el DOM');
        return;
      }

      console.log('✅ Player encontrado en el DOM - vinculando eventos');
      bindPlayerEvents(player);
      $scope.isPlaying = true;
      
    }, 250);
  });

  // ======== CLEANUP ========
  $scope.$on('$destroy', function() {
    const player = document.getElementById('player');
    if (player) {
      removePlayerEvents(player);
      console.log('🧹 Eventos limpiados al destruir el scope');
    }
  });

  // ======== INICIALIZAR ========
  console.log('🚀 Controlador inicializado');
  $scope.cargarPlaylists();
  $scope.cargar();
})

// ======== CONTROLADOR DEL MODAL GESTIONAR PLAYLISTS ========
.controller('modalGestionarPlaylistsCtrl', function(
  $scope,
  $uibModalInstance,
  $timeout,
  cancion,
  playlistsConCancion,
  playlists,
  playlistFactory
) {
  console.log('🚀 [MODAL] Controlador modal gestionar playlists cargado');
  console.log('📋 [MODAL] Canción:', cancion.nombre);
  console.log('📋 [MODAL] IDs de playlists con canción:', playlistsConCancion);

  $scope.cancion = cancion;
  $scope.cambiosRealizados = false;

  // Filtrar solo las playlists que contienen esta canción
  $scope.playlistsConCancion = playlists.filter(function(pl) {
    return playlistsConCancion.indexOf(pl.id) !== -1;
  });

  console.log('✅ [MODAL] Playlists filtradas:', $scope.playlistsConCancion.length);

  // Eliminar canción de una playlist
  $scope.eliminarDePlaylist = function(playlist) {
    const confirmar = confirm('¿Eliminar "' + $scope.cancion.nombre + '" de la playlist "' + playlist.nombre + '"?\n\nLa canción seguirá en tu biblioteca.');
    
    if (!confirmar) return;
    
    console.log('🗑️ [MODAL] Eliminando canción de playlist:', playlist.nombre);
    
    playlistFactory.eliminarCancion(playlist.id, $scope.cancion.id)
      .then(function() {
        console.log('✅ [MODAL] Eliminada correctamente');
        
        // Remover de la lista visual
        $scope.playlistsConCancion = $scope.playlistsConCancion.filter(function(pl) {
          return pl.id !== playlist.id;
        });
        
        $scope.cambiosRealizados = true;
        
        alert('✅ Canción eliminada de "' + playlist.nombre + '"');
        
        // Si ya no está en ninguna playlist, cerrar el modal
        if ($scope.playlistsConCancion.length === 0) {
          $timeout(function() {
            $scope.cerrar();
          }, 1000);
        }
      })
      .catch(function(err) {
        console.error('❌ [MODAL] Error:', err);
        alert('❌ Error al eliminar de la playlist');
      });
  };

  $scope.cerrar = function() {
    console.log('🔒 [MODAL] Cerrando modal con cambios:', $scope.cambiosRealizados);
    $uibModalInstance.close({ cambios: $scope.cambiosRealizados });
  };

  $scope.cancelar = function() {
    console.log('❌ [MODAL] Modal cancelado');
    $uibModalInstance.dismiss('cancel');
  };
});