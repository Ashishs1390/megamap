app.service('Timeline', function($http, $localStorage){
  return {
    journey: {
      save: function(report){
        console.log(report)
        $localStorage.report = report;
        $http.post('')
      },
      get: function(){
        console.log($localStorage.report)
        return [
          $localStorage.report,
          {
            doc: '<div>some html</div>',
            time: 1513201971744
          },
          {
            doc: '<div>some html</div>',
            time: 1513201971744
          },
          {
            doc: '<div>some html</div>',
            time: 1513201971744
          },
          {
            doc: '<div>some html</div>',
            time: 1513201971744
          },
          {
            doc: '<div>some html</div>',
            time: 1513201971744
          }
        ]
      }
    }
  }
})

app.controller('journeyMapReportTimelineCtrl', function($scope, Timeline){
  $scope.timelineView = true;
  $scope.showReport = function(report){
    $scope.currentReport = report;
    $scope.timelineView  = false;
  }
  $scope.reports = Timeline.journey.get()
  // Timeline.journey.get().then(function(reports){
  //   $scope.reports = reports;
  // })
})
