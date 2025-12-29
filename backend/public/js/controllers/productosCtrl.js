'use strict';

angular.module('ventasApp')
.controller('productosCtrl', function($scope, productosFactory) {

  $scope.productos = [];

  $scope.nuevo = {};

$scope.guardar = function () {
  productosFactory.save($scope.nuevo, function () {
    $scope.nuevo = {};
    cargarProductos();
  });
};


  function cargarProductos() {
    productosFactory.query(function(data) {
      $scope.productos = data;
    }, function(error) {
      console.error('Error al cargar productos', error);
    });
  }

  cargarProductos();

});
