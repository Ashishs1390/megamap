function dashboardbullseyeCtrl($http, $scope, $rootScope, $state, BullseyeAPI){
    $scope.width = window.innerWidth;
    $scope.height = window.innerHeight;
    $scope.title = 'Executive Dashboard';
    $scope.strategies = {}

    // $scope.interactions = []
    // $http.get('/api/bullseye/interactions').then(function(resp) {
    //   $scope.interactions = resp.data;
    // })
    //
    // $scope.showInteractions = function(string) {
    //   switch (string) {
    //     case 'effective':
    //       $scope.importantIsOpen = false;
    //       break;
    //     case 'important':
    //       $scope.effectiveIsOpen = false;
    //       break;
    //   }
    //   $scope.currentPopover = string
    // }
    //

    BullseyeAPI.GetBullseyeExecutiveData()
    .then(function(data){

      console.log(data)



      updateDataForComponent(data);
      $scope.data = data;

      $scope.selectInteraction = function(uuid) {
        updateDataForComponent(data, uuid)
      }
    });

    $scope.callback = function (selectedScore) {
      console.log('appjs' + selectedScore)
    }

    $scope.clickCallback = function(intersectionuuid){
      var intersection = findElement($scope.data.intersection, intersectionuuid);
      $rootScope.bullseyeJourneys = intersection.journeys;
      $state.go('dashboard.journey', {filtered: true, journeys: intersection.journeys.join('_')})
    }

    function findElement(array, element){
      if(!Array.isArray(array)){
        return;
      }
      for(var i=0; i< array.length; i++){
        if(array[i].intersectionUuid === element){
          return array[i];
        }
      }
    }

    function updateDataForComponent(data, interaction = null){
      augmentAvgScoreToStrategy(data);
      augmentAvgScoreToSegments(data);
      updateIntersectionScores(data, interaction);
    }

     function updateIntersectionScores(data, interactionUuid){
       for(var i=0; i<data.intersection.length;i++){
        var intersection = data.intersection[i];
        var avgScore;
        $scope.strategies[intersection.strategy.type] = intersection.strategy.name;
        if(interactionUuid) {
          console.log(intersection.interactions)
          for(var interaction of intersection.interactions) {
            console.log(interactionUuid)
            if(interaction.uuid === interactionUuid) {
              avgScore = interaction.effectiveness?interaction.effectiveness.toFixed(1).toString().replace(/\.0$/,''):null
            } else {
              avgScore = null;
            }
          }
        } else {
          avgScore = intersection.avgJourneyScore?intersection.avgJourneyScore.toFixed(1).toString().replace(/\.0$/,''):null;
        }
        intersection['averageScore'] = avgScore;
        intersection['userScore'] = intersection.journeys.length;
        intersection['arclabel'] = avgScore + '(' + intersection.journeys.length + ')';
        if(intersection.averageScore){
          updateScoreForElement(data.strategyTypes, intersection.strategytypeUuid, intersection.averageScore);
          updateScoreForElement(data.segments, intersection.segmentUuid, intersection.averageScore);
        }
      }
     }

     function updateScoreForElement(array, elementuuid, score){
      var element = findElementByuuid(array, elementuuid);
      element.datapoints += 1;
      element.totalscore += parseFloat(score);
      element.avgscore = (element.totalscore/element.datapoints).toFixed(1);
    }

    function augmentAvgScoreToStrategy(data){
      for(var i=0; i < data.strategyTypes.length; i++){
        data.strategyTypes[i]['avgscore'] = 0;
        data.strategyTypes[i]['datapoints'] = 0;
        data.strategyTypes[i]['totalscore'] = 0;
      }
    }

    function augmentAvgScoreToSegments(data){
      for(var i=0; i < data.segments.length; i++){
        data.segments[i]['avgscore'] = 0;
        data.segments[i]['datapoints'] = 0;
        data.segments[i]['totalscore'] = 0;
      }
    }

    function findElementByuuid(array, element){
      if(!Array.isArray(array)){
        return;
      }
      for(var i=0; i< array.length; i++){
        if(array[i].uuid === element){
          return array[i];
        }
      }
    }
}
