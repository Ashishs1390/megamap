app.config($stateProvider => {
  $stateProvider
  .state('dashboard.groups', {
    url: '/groups',
    templateUrl: "views/Dashboard/Groups/index.html",
    controller: 'GroupsCtrl'
  })
})
