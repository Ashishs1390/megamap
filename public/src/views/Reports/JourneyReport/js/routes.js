app.config(function($stateProvider) {
    $stateProvider
        .state('reports.timeline', {
            url: "journey/timeline",
            templateUrl: "views/Reports/JourneyReport/timeline.html",
            controller: "journeyMapReportTimelineCtrl",
        })
        .state('reports.journey', {
            url: "/journey/:uuid?:group",
            templateUrl: "views/Reports/JourneyReport/newindex.html",
            controller: "journeyMapReportCtrl",
            resolve: {
              journey:function($http, $stateParams){
                return $http.get(`/api/journey/${$stateParams.group ? 'group/' : ''}${$stateParams.uuid}`)
                .then(function(resp){
                  if(resp.status == 200){
                    console.log('the results', resp.data)
                    return resp.data;
                  }
                })
              }
            }
        })
        .state('reports.oldjourney', {
            url: "/journey/:uuid",
            templateUrl: "views/Reports/JourneyReport/index.html"
        })
});
