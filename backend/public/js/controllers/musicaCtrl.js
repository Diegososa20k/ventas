angular.module('ventasApp')
.controller('musicaCtrl', function(
  $scope,
  musicaFactory,
  playlistFactory,
  $sce
) {

  // ======== EXISTENTE ========
  $scope.tipo = 'musica';
  $scope.lista = [];
  $scope.seleccionado = null;

  $scope.cargar = function() {
    musicaFactory.listar($scope.tipo).then(res => {
      $scope.lista = res.data;
      $scope.seleccionado = null;
    });
  };

  $scope.reproducir = function(item) {
    $scope.seleccionado = item;

    if ($scope.tipo === 'musica') {
      $scope.mediaUrl = $sce.trustAsResourceUrl(
        '/media/mp3/' + encodeURIComponent(item.archivo_mp3)
      );
    }

    if ($scope.tipo === 'video') {
      $scope.mediaUrl = $sce.trustAsResourceUrl(
        '/media/mp4/' + encodeURIComponent(item.archivo_mp4)
      );
    }
  };

  // ======== PLAYLISTS ========
  $scope.playlists = [];
  $scope.menuPlaylist = null;
  $scope.menuStyle = {};

  $scope.cargarPlaylists = function() {
    playlistFactory.listar().then(res => {
      $scope.playlists = res.data;
    });
  };

  $scope.nuevaPlaylist = function(item) {
    const nombre = prompt('Nombre de la playlist');
    if (!nombre) return;

    playlistFactory.crear(nombre).then(() => {
      alert('Playlist creada');
      $scope.cargarPlaylists();
      $scope.cerrarMenu();
    });
  };

  $scope.agregarAPlaylist = function(item, playlist) {
    alert(
      'Aquí luego conectamos: ' +
      item.nombre + ' → ' + playlist.nombre
    );
  };

  $scope.abrirMenuPlaylist = function(item, $event) {
    $event.stopPropagation();
    $scope.menuPlaylist = item;
    $scope.cargarPlaylists();

    $scope.menuStyle = {
      top: $event.clientY + 'px',
      left: ($event.clientX - 200) + 'px'
    };
  };

  $scope.cerrarMenu = function() {
    $scope.menuPlaylist = null;
  };

  $scope.eliminar = function(item) {
    if (!confirm('¿Eliminar "' + item.nombre + '"?')) return;

    musicaFactory.eliminar(item.id).then(() => {
      $scope.cargar();
    });
  };

  $scope.cargar();


$scope.agregarAPlaylist = function(cancion, playlist) {
  playlistFactory.agregarCancion(
    playlist.id,     // 👈 ID real
    cancion.id       // 👈 ID real
  )
  .then(() => {
    alert('Canción agregada a la playlist');
    $scope.cerrarMenu();
  })
  .catch(err => {
    console.error(err);
    alert('Error al agregar canción');
  });
};


});
