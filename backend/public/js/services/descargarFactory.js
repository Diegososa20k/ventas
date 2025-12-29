// js/services/descargarFactory.js
angular.module('ventasApp')
.factory('descargarFactory', function($resource, API_URL) {
  return $resource(API_URL + '/descargas/:id', { id: '@id' }, {
    save: { method: 'POST' }
  });
});
