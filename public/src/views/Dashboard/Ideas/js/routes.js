app.config(function ($stateProvider) {
    $stateProvider
        .state('dashboard.ideas', {
            url: "/ideas",
            templateUrl: "views/Dashboard/Ideas/index.html",
        })
})