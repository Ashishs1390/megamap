app.config($stateProvider => {
  $stateProvider
  .state('dashboard.templates', {
    url: '/templates',
    templateUrl: "views/Dashboard/Templates/index.html",
    controller: 'TemplatesCtrl'
  })
})
