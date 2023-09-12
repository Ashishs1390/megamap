app.controller('inviteBullseyeCtrl', inviteBullseyeCtrl)


function bullseyeTenantCtrl($scope, $http, Alert, $rootScope, $uibModal, BullseyeAPI, GraphJS, $state) {
    //Get Local Library
    $scope.search = '';
    $scope.Getting = true;
    BullseyeAPI.GetTenantBullseyes("Bullseye")
        .then(function (bullseyes) {
            $scope.Getting = false;
            $scope.library = bullseyes;
        }).catch(function (err) {
            $scope.Getting = false;
            Alert.note(err.message)
        });

    //Set Controller accessible Modals
    $scope.PopEditModal = (data) => PopBullseyeEditModal(data, $uibModal);
    $scope.PopCreateModal = (data) => PopBullseyeCreateModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopConnectModal = (data) => PopBullseyeConnectModal(data, $uibModal);
    $scope.PopAttendeeModal = (data) => PopBullseyeAttendeeModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopBullseyeQuickReportModal(data, $uibModal);

    $scope.ViewReport = function (item) {
        $state.go("reports.bullseye", { uuid: item });
    }

}

function bullseyeAdminCtrl($scope, $http, Alert, $rootScope, $uibModal, BullseyeAPI, GraphJS, socket, $state) {
    //Get Bullseyes for this controller
    $scope.search = '';
    $scope.Getting = true;
    BullseyeAPI.GetAdminBullseyes($rootScope.Person.properties.uuid)
        .then(function (bullseyes) {
            $scope.Getting = false;
            $scope.library = bullseyes;
        }).catch(function (err) {
            $scope.Getting = false;
            Alert.note(err.message);
        });
    //Set actions alowed in this controller
    $scope.PopEditModal = (data) => PopBullseyeEditModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopCreateModal = (data) => PopBullseyeCreateModal(data, $uibModal);
    $scope.PopConnectModal = (data) => PopBullseyeConnectModal(data, $uibModal);
    $scope.PopAttendeeModal = (data) => PopBullseyeAttendeeModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopBullseyeQuickReportModal(data, $uibModal);

    $scope.ViewReport = function (item) {
        $state.go("reports.bullseye", { uuid: item });
    }
}



function bullseyeAttendeeCtrl($scope, $http, Alert, $rootScope, $uibModal, BullseyeAPI, GraphJS, socket, $state) {
    //Get Bullseyes
    $scope.search = '';
    $scope.Getting = true;
    BullseyeAPI.GetAttendeeBullseyes($rootScope.Person.properties.uuid)
        .then(function (bullseyes) {
            $scope.Getting = false;
            $scope.library = bullseyes;
        }).catch(function (err) {
            $scope.Getting = false;
            Alert.note(err.message)
        });

    $scope.ViewReport = function (item) {
        $state.go("reports.bullseye", { uuid: item });
    }
}



function connectBullseyeCtrl($scope, sweetAlert, Alert, GraphJS, BullseyeAPI, SharedAPI, $uibModalInstance, bullseye_uuid, $http, $state) {
    $scope.cancel = function () {
        $uibModalInstance.close();
    }
    $scope.Getting = true;
    $scope.finalData = null;
    $http.get('/api/node/update/strategytype').then(function(resp){
      BullseyeAPI.GetBullseyeConnections(bullseye_uuid).then(function (result) {
        $scope.Getting = false;
        $scope.bullseye_connections = result;
      })
    });

    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopBullseyeQuickReportModal(data, $uibModal);

    $scope.setsubgraph = function(data) {
        $scope.finalData = data;
    }
    $scope.submit = function () {
        $scope.posting = true;
        BullseyeAPI.SetBullseyeConnections($scope.finalData, bullseye_uuid)
        .then(function (res) {
            $state.reload();
            sweetAlert.swal({
                title: "Success!",
                text: "Your bullseye will be available to all systems soon",
                type: "success",
            }, function (isConfirm) {
                $uibModalInstance.close();
            });
        }).catch(function (err) {
            Alert.note(err.message)
        });
    }
};

function inviteBullseyeCtrl($scope, sweetAlert, Alert, GraphJS, BullseyeAPI, $uibModalInstance, bullseye_uuid) {
    $scope.cancel = function () {
        $uibModalInstance.close();
    }

    $scope.Getting = true;
    BullseyeAPI.GetBullseyeInvitees(bullseye_uuid).then(function (result) {
        $scope.Getting = false;
        $scope.initial_bullseye_connections = JSON.parse(JSON.stringify(result));
        $scope.initial_attendees = [];
        if($scope.initial_bullseye_connections.node_label_index.Person) {
          $scope.initial_attendees = $scope.initial_bullseye_connections.node_label_index.Person.map(function(uuid) {
            return $scope.initial_bullseye_connections.nodes[uuid].properties.uuid
          })
        }
        $scope.bullseye_connections = result;
    })


    $scope.submit = function () {
        $scope.posting = true;

        var attendees = {
          add: [],
          remove: []
        }

        if($scope.bullseye_connections.node_label_index.Person) {
          $scope.bullseye_connections.node_label_index.Person.forEach(function(uuid) {
            attendees.add.push($scope.bullseye_connections.nodes[uuid].properties.uuid)
          })
        }
        attendees.remove = $scope.initial_attendees.filter(function(i) {
          return attendees.add.indexOf(i) < 0;
        })

        BullseyeAPI.SetBullseyeAttendees(attendees, bullseye_uuid)
        .then(function () {
            sweetAlert.swal({
                title: "Success!",
                text: "Your bullseye will be available to all systems soon",
                type: "success",
            }, function (isConfirm) {
                $uibModalInstance.close();
            });
        }).catch(function (err) {
            Alert.note(err.message)
        });
    }
};
