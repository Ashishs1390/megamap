app.config(function ($stateProvider) {
  $stateProvider
  .state('dashboard.journey', {
    url: "/journey?filtered&journeys",
    templateUrl: "views/Dashboard/Journey/newindex.html",
    controller: 'JourneyCtrl'
  })
  .state('dashboard.adoption', {
    url: "/adoption?filtered&journeys",
    templateUrl: "views/Dashboard/Journey/newindex.html",
    controller: 'JourneyCtrl'
  })
  .state('dashboard.persona', {
    url: "/persona?filtered&journeys",
    templateUrl: "views/Dashboard/Journey/newindex.html",
    controller: 'JourneyCtrl'
  })
  .state('dashboard.learning', {
    url: "/learning?filtered&journeys",
    templateUrl: "views/Dashboard/Journey/newindex.html",
    controller: 'JourneyCtrl'
  })
  .state('dashboard.brainstorm', {
    url: "/brainstorm?filtered&journeys",
    templateUrl: "views/Dashboard/Journey/newindex.html",
    controller: 'JourneyCtrl'
  })
  .state('dashboard.horizon', {
    url: "/horizon?filtered&journeys",
    templateUrl: "views/Dashboard/Journey/newindex.html",
    controller: 'JourneyCtrl'
  })
})
