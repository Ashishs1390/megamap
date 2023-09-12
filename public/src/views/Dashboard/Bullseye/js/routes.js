app.config(function ($stateProvider) {
    $stateProvider
        .state('dashboard.bullseye', {
            url: "/bullseye",
            templateUrl: "views/Dashboard/Bullseye/index.html"
        })
        .state('dashboard.bullseyedetail', {
            url: "/bullseyedetail",
            controller: "dashboardbullseyeCtrl",
            templateUrl: "views/Dashboard/Bullseye/dashboardbullseye.html"
        })
})
