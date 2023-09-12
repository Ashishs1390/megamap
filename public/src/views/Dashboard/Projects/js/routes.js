app.config(function ($stateProvider) {
  $stateProvider
  .state('dashboard.projects', {
    url: "/projects",
    templateUrl: "views/Dashboard/Projects/projects.html"
  })
  .state('dashboard.projects.ideas', {
    url: "/ideas",
    templateUrl: "views/Dashboard/Projects/ideas.html",
    controller: "ProjectCtrl"
  })
  .state('dashboard.project', {
    url: "/project/:uuid",
    templateUrl: "views/Dashboard/Projects/project.html",
    controller: "ProjectCtrl"
  })

})
