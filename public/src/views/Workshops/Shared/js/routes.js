function authenticateRoute(Auth, $state, $rootScope) {
  Auth.validate().catch(function(){
    $rootScope.logout()
  })
}

app.config(function ($stateProvider) {
  $stateProvider
    .state('workshop', {
      abstract: true,
      url: "/workshop",
      template: "<div ui-view></div>",
      data: {
        pageTitle: 'Workshop'
      },
      resolve: {
        auth: authenticateRoute
      }
    })
});
