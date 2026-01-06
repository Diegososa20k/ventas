'use strict';

angular.module('ventasApp')
.controller('descargarCtrl', function($scope, descargarFactory, $rootScope) {

  $scope.form = {
    nombre: '',
    youtube_url: '',
    formato: 'mp3'
  };

  $scope.descargas = [];
  $scope.descargasActivas = $rootScope.descargasActivas || [];

  // Conectar a Socket.IO
  const socket = io('http://localhost:3000');

  socket.on('connect', function() {
    console.log('🔌 Conectado a Socket.IO');
  });

  // Escuchar progreso de descarga
  socket.on('descarga-progreso', function(data) {
    console.log('📊 Progreso:', data);
    
    $scope.$apply(function() {
      // Buscar si ya existe esta descarga
      let descarga = $scope.descargasActivas.find(d => d.id === data.id);
      
      if (descarga) {
        descarga.progreso = data.progreso;
        descarga.estado = data.estado;
        descarga.formato = data.formato;
        descarga.itemActual = data.itemActual || 1;
        descarga.totalItems = data.totalItems || 1;
        descarga.progresoItem = data.progresoItem || data.progreso;
      }
      
      // Guardar en rootScope para persistir entre vistas
      $rootScope.descargasActivas = $scope.descargasActivas;
    });
  });

  // Escuchar descarga completada
  socket.on('descarga-completada', function(data) {
    console.log('✅ Descarga completada:', data);
    
    $scope.$apply(function() {
      let descarga = $scope.descargasActivas.find(d => d.id === data.id);
      
      if (descarga) {
        descarga.estado = 'completado';
        descarga.progreso = 100;
      }
      
      $rootScope.descargasActivas = $scope.descargasActivas;
    });
  });

  // Escuchar error
  socket.on('descarga-error', function(data) {
    console.error('❌ Error en descarga:', data);
    
    $scope.$apply(function() {
      let descarga = $scope.descargasActivas.find(d => d.id === data.id);
      
      if (descarga) {
        descarga.estado = 'error';
      }
      
      $rootScope.descargasActivas = $scope.descargasActivas;
    });
  });

  $scope.descargar = function() {
    if (!$scope.form.nombre || !$scope.form.youtube_url) {
      alert('⚠️ Completa todos los campos');
      return;
    }

    descargarFactory.save($scope.form, function(res) {
      console.log('✅ Descarga iniciada:', res);
      
      const nuevaDescarga = {
        id: res.descarga.id,
        nombre: res.descarga.nombre,
        formato: res.descarga.formato,
        progreso: 0,
        estado: 'iniciando',
        itemActual: 0,
        totalItems: 1,
        progresoItem: 0
      };
      
      $scope.descargasActivas.push(nuevaDescarga);
      $rootScope.descargasActivas = $scope.descargasActivas;
      
      // Limpiar formulario
      $scope.form = {
        nombre: '',
        youtube_url: '',
        formato: 'mp3'
      };

    }, function(err) {
      console.error('❌ Error:', err);
      alert('❌ Error al iniciar descarga');
    });
  };

  // Función para cerrar una descarga
  $scope.cerrarDescarga = function(descarga) {
    const index = $scope.descargasActivas.indexOf(descarga);
    if (index > -1) {
      $scope.descargasActivas.splice(index, 1);
      $rootScope.descargasActivas = $scope.descargasActivas;
    }
  };

  // Función para cerrar todas las completadas
  $scope.cerrarCompletadas = function() {
    $scope.descargasActivas = $scope.descargasActivas.filter(d => 
      d.estado !== 'completado' && d.estado !== 'error'
    );
    $rootScope.descargasActivas = $scope.descargasActivas;
  };

  // Limpiar al destruir el scope
  $scope.$on('$destroy', function() {
    // NO desconectar socket para mantener las descargas activas
    // socket.disconnect();
  });

});