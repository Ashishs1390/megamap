app.config(function ($stateProvider) {
    $stateProvider
        .state('dashboard.kpi', {
            url: "/kpi",
            templateUrl: "views/Dashboard/Kpi/index.html",
        })
})