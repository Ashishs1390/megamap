app.config(function ($stateProvider) {
  $stateProvider
  .state('dashboard.users', {
    url: '/users',
    templateUrl: "views/Dashboard/Users/userList.html",
    controller: 'AdminCtrl',
    resolve: {
      auth: function(Auth) {
        Auth.validateTenant();
      }
    }
  })
})
