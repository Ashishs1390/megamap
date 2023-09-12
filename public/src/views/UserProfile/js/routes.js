function authenticateRoute(Auth, $state, $rootScope) {
  Auth.validate().catch(function(){
    $rootScope.logout()
  })
}

app.config(function ($stateProvider) {
  $stateProvider
  .state('account', {
    url: "/account",
    templateUrl: "views/UserProfile/index.html",
    controller: 'userAccountCtrl',
    resolve: {
      auth: authenticateRoute
    }
  })
})
