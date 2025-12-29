'use strict';

// js/controllers/descargarCtrl.js
angular.module('ventasApp')
.controller('descargarCtrl', function($scope, descargarFactory) {

  $scope.form = {
    nombre: '',
    youtube_url: '',
    formato: 'mp3'
  };

  $scope.descargar = function() {
    descargarFactory.save($scope.form, function(res) {
      alert('Descarga creada');
      $scope.form = {};
    }, function(err) {
      alert('Error al descargar');
    });
  };

});
