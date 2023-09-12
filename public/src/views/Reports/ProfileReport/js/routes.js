app.config(function($stateProvider) {
    $stateProvider
        .state('reports.profile', {
            url: "/profile/:uuid",
            templateUrl: "views/Reports/ProfileReport/newindex.html",
            controller: "journeyMapReportCtrl",
            resolve: {
              journey:function($http, $stateParams){
                return $http.get('/api/journey/'+$stateParams.uuid).then(function(resp){
                  if(resp.status == 200){
                    return resp.data;
                  }
                })
              }
            }
        })
});
