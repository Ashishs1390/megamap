app.config(function ($stateProvider) {
    $stateProvider
        .state('dashboard.component', {
            url: "/component/:label",
            templateUrl: "views/Dashboard/Component/index.html",
        })
})
