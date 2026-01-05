angular.module('ventasApp')
.factory('playlistFactory', function($http, API_URL) {
  return {
    listar: () => $http.get(API_URL + '/playlists'),
    crear: nombre => $http.post(API_URL + '/playlists', { nombre }),
    eliminar: id => $http.delete(API_URL + '/playlists/' + id), // 🆕

    agregarCancion: (playlistId, descargaId) =>
      $http.post(API_URL + '/playlists/' + playlistId + '/agregar', {
        descargaId
      }),

     // 🆕 Marcar/desmarcar como favorito
    toggleFavorito: (id, favorito) => 
      $http.patch(API_URL + '/playlists/' + id + '/favorito', { favorito }),

    canciones: playlistId =>
      $http.get(API_URL + '/playlists/' + playlistId + '/canciones'),

    verificarCancion: descargaId =>
      $http.get(API_URL + '/playlists/cancion/' + descargaId),

    // Eliminar canción de playlist
    eliminarCancion: (playlistId, descargaId) =>
      $http.delete(API_URL + '/playlists/' + playlistId + '/cancion/' + descargaId)
  };
});