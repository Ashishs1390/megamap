function userAccountCtrl($scope, $state, Auth, $rootScope) {
  $scope.user = angular.copy($rootScope.Person)
  $scope.changingPassword = false;

  $scope.goback = function(){
    if($rootScope.previousState){
      $state.go($rootScope.previousState)
    } else {
      $state.go("dashboard.journey");
    }
  }

  $scope.update = function(body){
    if(body.newPassword && body.newPassword.length > 0){
      if(body.newPassword.length > 6 && body.newPassword === body.newPasswordConfirm) {
        body.authType = 'password'
        $scope.changingPassword = true;
      }
      else {
        body.newPasswordConfirm = '';
        body.newPassword = '';

        alert('New passwords do not match!')
      }
    } else {
      body.authType = 'attributes'
    }
    Auth.update(body).then(function(resp){
      if(resp.status === 200){
        if($scope.changingPassword) {
          $rootScope.logout();
        } else {
          $state.go("dashboard.journey");
        }
      } else {
        $scope.error = resp.data
      }
    }).catch(function(err){
      console.log(err)
    });
  };
}
