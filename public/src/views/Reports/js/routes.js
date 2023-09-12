function authenticateRoute(Auth, $state, $rootScope) {
  Auth.validate().catch(function(){
    $rootScope.logout()
  })
}

app.config(function ($stateProvider) {
  $stateProvider
    .state('reports', {
      abstract: true,
      url: "/report",
      template: "<div ui-view></div>",
      resolve: {
        auth: authenticateRoute
      }
    })
});
