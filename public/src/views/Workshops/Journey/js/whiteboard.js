app.directive('whiteBoard', whiteBoard)
function whiteBoard() {
  return {
    restrict: 'E',
    scope: {
      channel: "<",
      user: "<"
    },
    replace: true,
    templateUrl: 'views/Workshops/Journey/whiteboard.html',
    controller:whiteBoardCtrl
  }
}

function whiteBoardCtrl($scope){
  let devMode = false;

  let token   = 'ruptive15access';
  let host    = devMode ? 'http://localhost:8080' : 'https://whiteboard.ruptive.cx';

  let username = $scope.user.name || $scope.user.email

  $scope.src = `${host}/?accesstoken=${token}&whiteboardid=${$scope.channel}}&username=${username}&uuid=${$scope.user.uuid}`
}
