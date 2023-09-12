app.component("swimlane", {
    bindings: {
        journey: '<',
        touchpoints: '<',
        usedinteractions: '<',
        usedpersonas: '<',
        effectiveImportance: '<',
        notecount: '<',
        cxipriority: '<'
    },
    controller: SwimLaneController,
    template: ['$templateCache', function($templateCache) {
        return $templateCache.get('views/Reports/JourneyReport/swimlane/swimlane.template.html')
    }]
});

function SwimLaneController($scope, $rootScope, $http, $uibModal, orderByFilter) {
  var ctrl = this;
  ctrl.hidelane = hidelane;
  ctrl.lanes = [];

  var sentiment = {
    pipeline:  `https://${$rootScope.subdomain}-sentiment.ruptive.cx/pipeline`,
    dashboard: `https://${$rootScope.subdomain}-sentiment.ruptive.cx/dashboard`
  }

  $scope.runSentimentPipeline = function() {
    ctrl.journey.stagesOnly.forEach(function( stage ) {
      stage.sentimentLoaded = false;

      $http.get(`${sentiment.pipeline}?uuid=${stage.uuid}`)
      .then(function(resp) {
        stage.sentimentLoaded = true;
      })
      .catch(function(error) {
        console.log(error)
      })
    })
  }

  // $scope.runSentimentPipeline()

  $scope.sentimentPipeline = sentiment.pipeline;

  ctrl.scoreColor = function(score) {
    if(!score) {
      return '';
    }
    else if(score < 6) {
      return 'red';
    }
    else if(score > 8) {
      return 'green';
    }
    else {
      return 'yellow';
    }
  }

  ctrl.hasVocComment = function(comments) {
    var vocCount = comments.filter(function(comment) {
      return comment.voc
    }).length
    return (vocCount > 0 ? true : false);
  }

  console.log(ctrl.notecount)

  ctrl.isEmpty = function(obj) {
    return angular.equals(obj, {})
  }

  ctrl.parseInt = function(str) {
    if(str && parseInt(str)) {
      return parseInt(str);
    }
  }

  $scope.$watchCollection('journey.interactions', function () {
    ctrl.journey.interactions = orderByFilter(ctrl.journey.interactions, ['order']);
  });

  // $scope.$parent.$watch('journey.notes', function(notes){
  //   if(notes){
  //     console.log('notes', notes)
  //     ctrl.notes = notes;
  //     for(var i=0; i< notes.length; i++){
  //       ctrl.lanes.push(true);
  //     }
  //   }
  // })

  // ctrl.$onInit = function() {
  // }
  // ctrl.$onChanges = function(componentProperties) {
  // };
  function hidelane(id){
    console.log(id);
    ctrl.lanes[id] = false;
  }

  ctrl.sentimentModal = function( journeyUuid, stage ) {
    return
    if(stage.sentimentLoaded) {
      $uibModal.open({
        templateUrl: 'views/Reports/JourneyReport/swimlane/sentiment.html',
        backdrop:    'static',
        windowClass: 'sentiment-modal',
        keyboard:    false,
        controller: function( $scope, $uibModalInstance ) {
          $scope.url = `${sentiment.dashboard}/?journey=${journeyUuid}&stage=${stage.uuid}`

          $scope.close = function () {
            $uibModalInstance.close();
          };
        }
      });
    }
    else {
      alert('Sentiment Pipeline has not run, please try again soon')
    }
  }

}
