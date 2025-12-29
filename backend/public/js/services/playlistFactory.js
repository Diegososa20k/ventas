angular.module('ventasApp')
.factory('playlistFactory', function($http, API_URL) {
  return {
    listar: () => $http.get(API_URL + '/playlists'),
    crear: nombre => $http.post(API_URL + '/playlists', { nombre }),

    agregarCancion: (playlistId, descargaId) =>
      $http.post(API_URL + '/playlists/' + playlistId + '/agregar', {
        descargaId
      }),

    canciones: playlistId =>
      $http.get(API_URL + '/playlists/' + playlistId + '/canciones')
  };
});
