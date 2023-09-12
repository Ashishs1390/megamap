app.controller('AdminCtrl', function($http, $scope, $uibModal) {
  $scope.users = [];
  $scope.editMode = false;
  $scope.itemPerPage = 50;
  $scope.currentPage = 0;
  $scope.page = 1;
  $scope.totalItems = 0;
  $scope.search = "";
  $scope.searchTerm = '';
  $scope.updateUser = function(props){
    console.log(props)
    $http.put('/api/user/update', { user: props })
    .then(function(resp) {
      console.log(resp)
    }).catch(function(err) {
      console.log(err)
    });
  }


  $scope.typeOf = (val) => {
    return typeof(val)
  }

  $scope.updateProperty = function(uuid, key, value){
    let obj = {
      uuid: uuid
    }
    obj[key] = value;
    $scope.updateUser(obj);
  }

  $scope.getRole = function(user) {
    if(user.tenant){
      return "Tenant";
    } else if(user.admin) {
      return "Admin";
    } else if(user.external) {
      return "External";
    } else if(user.power_user) {
      return "Power User"
    } else {
      return "Attendee"
    }
  }

  $scope.setRole = function(user, roleId) {
    if(roleId === 3) {
      // TENANT
      user.tenant = true;
      user.admin  = true;
      user.external = false;
      user.power_user = false;
    } else if(roleId === 2) {
      // ADMIN
      user.tenant = false;
      user.admin  = true;
      user.external = false;
      user.power_user = false;
    } else if(roleId === 1) {
      // ATTENDEE
      user.tenant = false;
      user.admin  = false;
      user.external = false;
      user.power_user = false;
    } else if(roleId === 0) {
      // EXTERNAL ATTENDEE
      user.tenant = false;
      user.admin  = false;
      user.external = true;
      user.power_user = false;
    } else if(roleId === 4) {
      // POWER USER
      user.tenant = false;
      user.admin  = false;
      user.external = false;
      user.power_user = true;
    }
    $scope.updateUser({
      uuid: user.uuid,
      admin: user.admin,
      tenant: user.tenant,
      external: user.external,
      power_user: user.power_user
    });
  }

  $scope.sortState = {
    shift: false,

  }

  $scope.loadUsers = function(event, orderBy) {
    $scope.currentPage = 1

    if(event) $scope.sortState.shift = event.shiftKey

    $scope.sortState.orderBy = orderBy

    let params = {
      skip:0,
      limit: $scope.itemPerPage,
      sort: ($scope.sortState.shift ? 'DESC' : 'ASC'),
      orderBy: $scope.sortState.orderBy,
      searchTerm:''
    }
    $http({ method: 'GET', url: '/api/user/new', params }).then(function(resp){
        $scope.users = resp.data;
      }).catch(function(err){
        console.log(err)
    });
    $http({ method: 'GET', url: '/api/user/new/count', params }).then(function(resp){
        $scope.totalItems = resp.data.count;
      }).catch(function(err){
        console.log(err)
    });
  }

  $scope.loadUsers(null, 'email')

  $scope.changeUsers = function(){
    let skip = 0;
    if($scope.currentPage != 1){
      skip = (($scope.currentPage - 1) * $scope.itemPerPage) +1;
      skip =skip-1;
    } else {
      skip = 0;
    }
    let params = {
      skip:skip,
      sort: ($scope.sortState.shift ? 'DESC' : 'ASC'),
      orderBy: $scope.sortState.orderBy,
      limit: $scope.itemPerPage,
      searchTerm:$scope.searchTerm
    }

    $http({ method: 'GET', url: '/api/user/new', params }).then(function(resp){
        $scope.users = resp.data;
      }).catch(function(err){
        console.log(err)
    });
  }
  let delayTimer = "";
  $scope.searchPause = true;
  $scope.fetchUsersOnSearch = function(){
    $scope.searchTerm = $scope.search;
    if($scope.searchTerm !="" ){
      $scope.searchPause = true;
    }
    if($scope.searchPause){
       let params = {
        skip:0,
        limit: $scope.itemPerPage,
        searchTerm: $scope.searchTerm,
      };
      clearTimeout(delayTimer);
      delayTimer = setTimeout(function() {
          $http({ method: 'GET', url: '/api/user/new', params })
          .then((resp)=>{
              $scope.currentPage = 0;
              $scope.users = resp.data;
              if($scope.searchTerm == "" || $scope.searchTerm == undefined) {
                $scope.searchPause = false;
              } else {
                $scope.searchPause = true;
              }
          });

          $http({ method: 'GET', url: '/api/user/new/count', params })
          .then((nodes)=>{
            $scope.totalItems = nodes.data.count;
          })
      }, 500);
    }



  }

  $scope.resetPassword = function(email, newPassword) {
    if (!newPassword || newPassword.length < 1) {
      newPassword = 'password'
    }

    var confirmReset = confirm('Are you sure you want to reset this password to ' +newPassword + '?')
    if(confirmReset) {
      $http.post('/api/auth/resetPassword', {
        email: email,
        password: newPassword
      }).then(function(resp) {
        console.log(resp)
        $scope.newPassword = '';
        $scope.newPasswordByEmail = '';
        // alert(resp.data)
      }).catch(function(err){
        console.log(err)
        alert(err.data)
      })
    }
  }

  $scope.addUsers = function () {
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Dashboard/Users/add.html',
      backdrop: 'static',
      keyboard: false,
      controller: function( $scope, $uibModalInstance ) {
        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
        $scope.create = function () {
          $http.post('/api/user/generate', {
            users: $scope.users
          }).then(function (resp) {
            console.log(resp.data)
            $uibModalInstance.close( resp.data );
            // $window.location.reload()
          }).catch(function (err) {
            console.log(err);
          })
        }
      }
    });
    modalInstance.result.then(function(resp) {
      console.log(resp)
    }, function () {
      console.log('modal closed')
    });
  };
});
