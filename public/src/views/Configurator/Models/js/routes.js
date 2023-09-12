function authenticateRoute(Auth, $state, $rootScope) {
  Auth.validate().catch(function(){
    $rootScope.logout()
  })
}

app.config(function ($stateProvider) {
    $stateProvider
        .state('model', {
            abstract: true,
            url: "/model/",
            templateUrl: "views/Configurator/Shared/wrapper.html",
            resolve: {
              auth: authenticateRoute
            }
        })
        .state('model.focus', {
            url: "focus?or_ids&and_ids&view_mode&node_label&rel_type",
            templateUrl: "views/Configurator/Models/focus.html",

        })
        .state('model.label', {
            url: "label/:label",
            templateUrl: "views/Configurator/Models/index.html",
        })
        .state('model.connector', {
            url: "connect?from_id&to_id&rel_type&from_search_label&to_search_label&from_search_term&to_search_term",
            templateUrl: "views/Configurator/Models/connector.html",
        })
})
