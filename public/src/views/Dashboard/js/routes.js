function authenticateRoute(Auth, $state, $rootScope) {
  Auth.validate().catch(function(){
    $rootScope.logout()
  })
}

app.config(function ($stateProvider) {
  $stateProvider
  .state('dashboard', {
    abstract: true,
    url: "/dashboard",
    templateUrl: "views/Configurator/Shared/wrapper.html",
    resolve: {
      auth: authenticateRoute
    }
  })
});
