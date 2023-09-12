function componentTenantCtrl($scope, $http, Alert, $rootScope, $uibModal, ComponentAPI, GraphJS, $state, $stateParams) {
    $scope.label = $stateParams.label
    console.log($scope.label)
    //Get Local Library
    $scope.search = '';
    $scope.Getting = true;
    ComponentAPI.GetTenantComponents($scope.label)
        .then(function (Components) {
          console.log(Components)
            $scope.Getting = false;
            $scope.library = Components;
            if($scope.library.node_label_index[$scope.label]) {
              $scope.library.node_label_index[$scope.label].sort((a,b)=>{
                if(!$scope.library.outgoing_nodes.author[a]) return 0;
                if(!$scope.library.outgoing_nodes.author[b]) return 1;
                let author_uuid_a = $scope.library.outgoing_nodes.author[a][0];
                let author_uuid_b = $scope.library.outgoing_nodes.author[b][0];
                if(author_uuid_a == $rootScope.Person.properties.uuid) return 0;
                else return 1;
              })
            }
        }).catch(function (err) {
            $scope.Getting = false;
            // Alert.note(err.message)
        });

    //Set Controller accessible Modals
    $scope.PopEditModal = (data) => PopComponentEditModal(data, $uibModal, ()=>$state.reload());
    $scope.PopCreateModal = (data) => PopComponentCreateModal(data, $uibModal, ()=>$state.reload());
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
}

function componentAdminCtrl($scope, $http, sweetAlert, $rootScope, $uibModal, ComponentAPI, GraphJS, $state, $stateParams) {
    //Get Components for this controller
    $scope.search = '';
    $scope.Getting = true;
    ComponentAPI.GetAdminComponents($rootScope.Person.properties.uuid, $scope.label)
        .then(function (Components) {
            $scope.Getting = false;
            $scope.library = Components;
            if($scope.library.node_label_index[$scope.label]) {
              $scope.library.node_label_index[$scope.label].sort((a,b)=>{
                if(!$scope.library.outgoing_nodes.author[a]) return 0;
                if(!$scope.library.outgoing_nodes.author[b]) return 1;
                let author_uuid_a = $scope.library.outgoing_nodes.author[a][0];
                let author_uuid_b = $scope.library.outgoing_nodes.author[b][0];
                if(author_uuid_a == $rootScope.Person.properties.uuid) return 0;
                else return 1;
              })
            }
        }).catch(function (err) {
            $scope.Getting = false;
        });
    //Set actions alowed in this controller
    $scope.PopEditModal = (data) => PopComponentEditModal(data, $uibModal, ()=>$state.reload());
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopCreateModal = (data) => PopComponentCreateModal(data, $uibModal, ()=>$state.reload());
}
