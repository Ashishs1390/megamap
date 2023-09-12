app.config(function ($stateProvider) {
  $stateProvider
  .state('workshop.journey', {
    url: "/journey?:id&:stage&:tab&:group",
    templateUrl: "views/Workshops/Journey/newindex.html",
    controller: 'productJourneyCtrl',
    resolve: {
      journey: ($http, $stateParams) => {
        return $http.get(`/api/journey/${$stateParams.group ? 'group/' : ''}${$stateParams.id}`)
        .then(resp => {
          if(resp.status == 200){
            return resp.data;
          }
        })
      },
      journeyConnections: ($http, $stateParams) => {
        return $http.get(`/api/journey/${$stateParams.id}/connections`)
        .then( resp => {
          if(resp.status == 200){
            return {
              objects: resp.data,
              from_uuids: resp.data.map(c => c.from_uuid)
            }
          }
        })
      }
    }
  })
});
