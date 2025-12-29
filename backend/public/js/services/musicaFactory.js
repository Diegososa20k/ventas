// js/services/musicaFactory.js
angular.module('ventasApp')
.factory('musicaFactory', function($http, API_URL) {
  return {
    listar: tipo => $http.get(API_URL + '/descargas/media/' + tipo),
    eliminar: id => $http.delete(API_URL + '/descargas/' + id)
  };
});

