'use strict';

angular.module('ventasApp')

.factory('productosFactory', function($resource, API_URL) {
  return $resource(`${API_URL}/productos/:id`,
    { id: '@id' },
    {
      update: { method: 'PUT' }
    }
  );
});
