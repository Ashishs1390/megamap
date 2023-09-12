app.config(function ($stateProvider) {
  $stateProvider
  .state('workshop.graphs', {
    url: "/graphs?:id",
    templateUrl: "views/Graphs/Journey/graphs.html",
    controller: 'JourneyGraphsCtrl3',
    resolve: {
      journey:function($http, $stateParams){
        return $http.get('/api/journey/'+$stateParams.id).then(function(resp){
          if(resp.status == 200){
            return resp.data;
          }
        })
      }
    }
  })
  .state('workshop.horizon_graphs', {
    url: "/horizon_graphs?:id",
    templateUrl: "views/Graphs/Journey/horizon_graphs.html",
    controller: 'HorizonGraphCtrl',
    resolve: {
      journey:function($http, $stateParams){
        return $http.get('/api/journey/'+$stateParams.id).then(function(resp){
          if(resp.status == 200){
            return resp.data;
          }
        })
      }
    }
  })
  .state('workshop.graphsnew', {
    url: "/graphsnew?:id",
    templateUrl: "views/Graphs/Journey/graphs_new.html",
    controller: 'JourneyGraphsCtrl2',
    resolve: {
      journey: function($http, $stateParams){
        return $http.get('/api/journey/'+$stateParams.id).then(function(resp){
          if(resp.status == 200){
            var journey = resp.data;
            journey.stages.map(function(stage){
              $http({
                method: 'GET',
                url: '/api/journey/'+$stateParams.id+'/stage/'+stage.uuid,
                params: {
                  'interaction_orders': journey.interaction_orders,
                  'nocache': new Date().getTime()
                }
              }).then(function(resp){
                stage.notes = resp.data;
                return stage;
              })
            })
            return journey;
          }
        })

      }
    }
  })
});
