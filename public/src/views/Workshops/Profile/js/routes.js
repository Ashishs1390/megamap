
app.config(function ($stateProvider) {
    $stateProvider
        .state('workshop.profile', {
            url: "/profile?:id",
            templateUrl: "views/Workshops/Profile/index.html"
        })
});