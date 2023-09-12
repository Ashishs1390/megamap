function workshopbullseyeCtrl($scope, $location, $rootScope, $window, WorkshopBullseyeAPI){
    // listen to real-time data push
    var fayeClient = new $window.Faye.Client('https://a1968972.fanoutcdn.com/bayeux');
    fayeClient.subscribe('/'+$location.$$search.id, function (data) {
      handleEvents(data);
    }).then(function() {
      console.log('Listening for Server-Side Events');
    });
    var strategyTypes = [];
    var segments = [];
    $scope.strategies = {};
    init();

    function init(){
      var id = $location.$$search.id;
      $scope.title = $location.$$search.title;
      var personuuid = $rootScope.Person.properties.uuid;
      WorkshopBullseyeAPI.GetBullseyeStrategydata(id,personuuid)
          .then(function(data){
            strategyTypes = data.strategyTypes;
            segments = data.segments;

            // console.log('Before construct:' + JSON.stringify(data));
            console.log('Before construct')
            updateDataForComponent(data);
            console.log('After construct')
            // console.log('Before socket:' + JSON.stringify(data));
            $scope.data = data;
          });

      $scope.width = window.innerWidth;
      $scope.height = window.innerHeight;
    }

    function handleEvents(data) {
      if(!data) return;
      var intersectionData;
      Object.keys(data).forEach(function(action) {
        intersectionData = data[action];
        switch (action) {
          case 'workshopbullseye.update':
            if(intersectionData && $scope.data.intersection) {
              for(var index in $scope.data.intersection) {
                if(intersectionData.intersectionUuid === $scope.data.intersection[index].intersectionUuid) {
                  $scope.data.intersection[index].voteCount = intersectionData.voteCount;
                  $scope.data.intersection[index].totalScore = intersectionData.totalScore;
                  $scope.data.intersection[index].averageScore = intersectionData.averageScore;
                }
              }
              var newdata = {
                strategyTypes: strategyTypes,
                segments: segments,
                intersection: $scope.data.intersection
              }
              updateIntersectionScores(newdata);
              $scope.data = newdata;
            }
            break;
            case 'delete.comment':
            $rootScope.$broadcast("getCommentsData" , data);
            break;

          case 'add.comment':
            $rootScope.$broadcast("getCommentsData" , data);
            break;

          default:
            console.log('Action "'+ action +'" is not defined');
        }
        $scope.$apply();
      })
    }

    $scope.callback = function (uservote, intersectionUuid) {
      var data = {personuuid: $rootScope.Person.properties.uuid,score: uservote};
      for(var index in $scope.data.intersection) {
        if(intersectionUuid === $scope.data.intersection[index].intersectionUuid) {
          $scope.data.intersection[index].userScore = uservote;
        }
      }
      var newdata = angular.copy($scope.data);
      updateIntersectionScores(newdata);
      $scope.data = newdata;

      WorkshopBullseyeAPI.PostBullseyeStrategydata($location.$$search.id,intersectionUuid,data).then(function(result){
        console.log('success');
      });
    }

    $scope.clickCallback = function(intersection){
      console.log('bullseye click action');
    }

     function updateDataForComponent(data){
      augmentAvgScoreToStrategy(data);
      augmentAvgScoreToSegments(data);
      updateIntersectionScores(data);
    }

    function updateIntersectionScores(data){
      for(var i=0; i<data.intersection.length;i++){
        var intersection = data.intersection[i];
        $scope.strategies[intersection.strategy.type] = intersection.strategy.name;
        // console.log(JSON.stringify(intersection));
        intersection.averageScore = intersection.averageScore?parseFloat(intersection.averageScore).toFixed(1).toString().replace(/\.0$/,''):null;
        intersection['arclabel'] = intersection.averageScore + '' + (intersection.userScore?'('+intersection.userScore + ')':'');
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
