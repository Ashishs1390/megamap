function authenticateRoute(Auth, $state, $rootScope) {
  Auth.validate().catch(function(){
    $rootScope.logout()
  })
}

app.config(function ($stateProvider) {
  $stateProvider
  .state('workshopcard', {
    abstract: true,
    url: "/workshop",
    templateUrl: "views/Configurator/Shared/wrapper.html",
    resolve: {
      auth: authenticateRoute
    }
  })
  .state('workshopcard.bullseye', {
    url: "/bullseye",
    templateUrl: "views/Workshops/Bullseye/index.html"
  })
  .state('workshop.bullseye', {
    url: "/bullseyedetail?id&title",
    controller: "workshopbullseyeCtrl",
    templateUrl: "views/Workshops/Bullseye/workshopbullseye.html",
  })
})
