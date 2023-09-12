app.config(function ($stateProvider) {
    $stateProvider
        .state('dashboard.blockers', {
            url: "/blockers",
            templateUrl: "views/Dashboard/Blockers/index.html",
        })
})