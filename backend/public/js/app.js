var app = angular.module('ventasApp', [
  'ui.router',
  'ngResource'
]);

app.constant('API_URL', 'http://localhost:3000');

/* ============================
   CONFIGURACIÓN
============================ */
app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  /* 🔐 INTERCEPTOR (opcional, listo para JWT) */
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

  // Ruta por defecto
  $urlRouterProvider.otherwise('/principal');

  /* 📌 STATES */
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
    })


});
