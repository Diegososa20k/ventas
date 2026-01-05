var app = angular.module('ventasApp', [
  'ui.router',
  'ngResource',
  'ui.bootstrap'
]);

app.constant('API_URL', 'http://localhost:3000');

/* ============================
   CONTROLADOR PRINCIPAL
============================ */
app.controller('mainCtrl', function($scope) {
  $scope.sidebarCollapsed = false;
  
  $scope.toggleSidebar = function() {
    $scope.sidebarCollapsed = !$scope.sidebarCollapsed;
    console.log('Sidebar collapsed:', $scope.sidebarCollapsed);
  };
});

/* ============================
   CONFIGURACIÓN
============================ */
app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  $httpProvider.interceptors.push(function($window) {
    return {
      request: function(config) {
        const token = $window.localStorage.getItem('token');
        if (token) {
          config.headers['x-access-token'] = token;
        }
        return config;
      }
    };
  });

  $urlRouterProvider.otherwise('/principal');

  $stateProvider

    .state('principal', {
      url: '/principal',
      template: '<h2>Bienvenido al sistema de ventas</h2>',
      requiresLogin: true
    })

    .state('productos', {
      url: '/productos',
      templateUrl: 'views/productos.html',
      controller: 'productosCtrl',
      requiresLogin: true
    })

    .state('descargar', {
      url: '/descargar',
      templateUrl: 'views/descargar.html',
      controller: 'descargarCtrl',
      requiresLogin: true
    })

    .state('musica', {
      url: '/musica',
      templateUrl: 'views/musica.html',
      controller: 'musicaCtrl',
      requiresLogin: true
    });

});