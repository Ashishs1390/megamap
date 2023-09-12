app.controller('GroupsCtrl', function($http, $state, $scope, $uibModal, sweetAlert, $rootScope) {
  $scope.groups = []

  $scope.LoadGroups = () => {
    $scope.Getting = true;

    $http.get('/api/group/all/Journey').then(resp => {
      $scope.groups = resp.data

      $scope.Getting = false;
    })
    .catch(error => console.error(error))
  }

  if($state.current.name === 'dashboard.groups') {
    $scope.LoadGroups()
  }


  $scope.DeleteGroup = (group) => {
    sweetAlert.swal({
      title: "Delete this group?",
      text: group.name,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete"
    }, confirmed => {
      if(confirmed) {
        $scope.Getting = true;

        $http.delete(`/api/group/${group.uuid}`)
        .then(resp => {
          let idx = $scope.groups.findIndex(t => t.uuid === group.uuid)
          $scope.groups.splice(idx, 1)

          $scope.Getting = false;
        })
        .catch(error => console.error(error))
      }
    });
  }

  $scope.CreateGroup = (group, label) => {
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Dashboard/Groups/_create_group.html',
      backdrop: 'static',
      keyboard: false,
      controller: function ($scope, $uibModalInstance) {
        $scope.group = group
        $scope.group.author = $rootScope.Person.properties.uuid
        $scope.group.workshop_type = 'journey'

        $scope.create = () => {
          $scope.group.name = $scope.name;
          $scope.group.labels = [label]

          $http.post('/api/group', { group })
          .then(resp => {
            $uibModalInstance.close();

            $state.go('workshop.journey', {id: resp.data.uuid, group: true})
          })
          .catch(err => console.error(err))
        }
        $scope.cancel = () => {
          $uibModalInstance.close();
        }
      }
    });
  }

  $scope.GroupOverview = (group, view) => {
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Dashboard/Groups/_group_overview.html',
      backdrop: 'static',
      keyboard: false,
      controller: function ($scope, $uibModalInstance) {
        $scope.view = view;
        $scope.group = group;
        $scope.members = [];

        $http.get(`/api/group/members/${group.uuid}`)
        .then(resp => {
          $scope.members = resp.data
        })
        .catch(error => {
          console.log(error)
        })

        $scope.cancel = () => {
          $uibModalInstance.close();
        }
      }
    });
    modalInstance.result.then(data => {
      console.log(data)
    },
    () => {
      console.log('hey now')
      // $log.info('Modal dismissed at: ' + new Date());
    });
  }

  $scope.MemberGroups = (node, view) => {
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Dashboard/Groups/_node_groups.html',
      backdrop: 'static',
      keyboard: false,
      controller: function ($scope, $uibModalInstance) {
        $scope.view = view;
        $scope.groups = [];

        $http.get(`/api/group/${node.uuid}`)
        .then(resp => {
          $scope.groups = resp.data
        })
        .catch(error => {
          console.log(error)
        })

        $scope.cancel = () => {
          $uibModalInstance.close();
        }
      }
    });
    modalInstance.result.then(data => {
      console.log(data)
    },
    () => {
      console.log('hey now')
      // $log.info('Modal dismissed at: ' + new Date());
    });
  }

  $scope.ViewGroup = (group, isGroup = true) => {
    let params = { id: group.uuid }

    if(isGroup) params.group = true

    $state.go('workshop.journey', params)
  }

})
