app.config(function($locationProvider, $stateProvider, $urlRouterProvider, $compileProvider){
  $locationProvider.html5Mode(true);
  $compileProvider.debugInfoEnabled(true);

  function authenticateRoute(Auth, $state, $rootScope) {
    Auth.validate().catch(function(){
      $rootScope.logout()
    })
  }

  $stateProvider
  .state('home', {
    url:'/',
    templateUrl: 'home/home.html',
    resolve: {
      auth: authenticateRoute
    },
    controller: function($state){
      $state.go('dashboard.journey')
    }
  })
  .state('self-service', {
    url:'/self-service',
    templateUrl: 'auth/selfService.html',
    controller: 'AuthCtrl'
  })
  .state('login', {
    url:'/login',
    templateUrl: 'auth/login.html',
    controller: 'AuthCtrl'
  })
  .state('register', {
    url:'/register',
    templateUrl: 'auth/register.html',
    resolve: {
      auth: authenticateRoute
    },
    controller: 'AuthCtrl'
  })
  .state('activate', {
    url:'/activate?token',
    templateUrl: 'auth/activate.html',
    controller: 'AuthCtrl'
  })
  .state('confirm', {
    url: '/confirm',
    templateUrl: 'auth/confirm.html',
    controller: 'ConfirmationCtrl'
  })

   .state("drag", {
    url: "/drag",
    templateUrl:"views/Configurator/draggable_test.html"
  })

  // catchall route
  $urlRouterProvider.otherwise('/dashboard/journey');
});
