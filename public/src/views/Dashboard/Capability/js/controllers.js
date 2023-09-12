function capabilityTenantCtrl($scope, $http, Alert, $rootScope, $uibModal, CapabilityAPI, GraphJS, $state) {
    //Get Local Library
    $scope.search = '';
    $scope.Getting = true;
    CapabilityAPI.GetTenantCapabilitys()
        .then(function (Capabilitys) {
            $scope.Getting = false;
            $scope.library = Capabilitys;
            $scope.library.node_label_index.Capability.sort((a,b)=>{
              if(!$scope.library.outgoing_nodes.author[a]) return 0;
              if(!$scope.library.outgoing_nodes.author[b]) return 1;
              let author_uuid_a = $scope.library.outgoing_nodes.author[a][0];
              let author_uuid_b = $scope.library.outgoing_nodes.author[b][0];
              if(author_uuid_a == $rootScope.Person.properties.uuid) return 0;
              else return 1;
            })
        }).catch(function (err) {
            $scope.Getting = false;
            Alert.note(err.message)
        });

    //Set Controller accessible Modals
    $scope.PopEditModal = (data) => PopCapabilityEditModal(data, $uibModal, ()=>$state.reload());
    $scope.PopCreateModal = (data) => PopCapabilityCreateModal(data, $uibModal, ()=>$state.reload());
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
}

function capabilityAdminCtrl($scope, $http, sweetAlert, $rootScope, $uibModal, CapabilityAPI, GraphJS, $state) {
    //Get Capabilitys for this controller
    $scope.search = '';
    $scope.Getting = true;
    CapabilityAPI.GetAdminCapabilitys($rootScope.Person.properties.uuid)
        .then(function (Capabilitys) {
            $scope.Getting = false;
            $scope.library = Capabilitys;
            $scope.library.node_label_index.Capability.sort((a,b)=>{
              if(!$scope.library.outgoing_nodes.author[a]) return 0;
              if(!$scope.library.outgoing_nodes.author[b]) return 1;
              let author_uuid_a = $scope.library.outgoing_nodes.author[a][0];
              let author_uuid_b = $scope.library.outgoing_nodes.author[b][0];
              if(author_uuid_a == $rootScope.Person.properties.uuid) return 0;
              else return 1;
            })
        }).catch(function (err) {
            $scope.Getting = false;
        });
    //Set actions alowed in this controller
    $scope.PopEditModal = (data) => PopCapabilityEditModal(data, $uibModal, ()=>$state.reload());
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopCreateModal = (data) => PopCapabilityCreateModal(data, $uibModal, ()=>$state.reload());
}
