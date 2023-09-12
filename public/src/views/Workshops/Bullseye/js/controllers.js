function WorkshopsBullseyeTenantCtrl($scope, $http, Alert, $rootScope, $uibModal, WorkshopBullseyeAPI, GraphJS, $state) {
    //Get Local Library
    $scope.search = '';
    $scope.Getting = true;
    WorkshopBullseyeAPI.GetTenantBullseyes("Bullseye")
        .then(function (bullseyes) {
            $scope.Getting = false;
            $scope.library = bullseyes;
            console.log($scope.library)
        }).catch(function (err) {
            $scope.Getting = false;
            Alert.note(err.message)
        });

    $scope.selectCompanyBullseye = function(uuid) {
      $http.post('/api/bullseye/companyBullseye', {uuid: uuid})
    }

    //Set Controller accessible Modals
    $scope.PopEditModal = (data) => WorkshopsPopBullseyeEditModal(data, $uibModal);
    $scope.PopCreateModal = (data) => WorkshopsPopBullseyeCreateModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopConnectModal = (data) => WorkshopsPopBullseyeConnectModal(data, $uibModal);
    $scope.PopAttendeeModal = (data) => {
        $rootScope.bullseye__uuid = data;
      WorkshopsPopBullseyeAttendeeModal(data, $uibModal)
    };
    $scope.PopQuickReportModal = (data) => PopBullseyeQuickReportModal(data, $uibModal);

    $scope.ViewReport = function (item) {
        $state.go("reports.bullseye", { uuid: item });
    }

}

function WorkshopsBullseyeAdminCtrl($scope, $http, $rootScope, $uibModal, WorkshopBullseyeAPI, GraphJS, $state) {
    //Get Bullseyes for this controller
    $scope.search = '';
    $scope.Getting = true;
    WorkshopBullseyeAPI.GetAdminBullseyes($rootScope.Person.properties.uuid)
        .then(function (bullseyes) {
            $scope.Getting = false;
            $scope.library = bullseyes;
        }).catch(function (err) {
            $scope.Getting = false;
        });
    //Set actions alowed in this controller
    $scope.PopEditModal = (data) => WorkshopsPopBullseyeEditModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopCreateModal = (data) => WorkshopsPopBullseyeCreateModal(data, $uibModal);
    $scope.PopConnectModal = (data) => WorkshopsPopBullseyeConnectModal(data, $uibModal);
    $scope.PopAttendeeModal = (data) => WorkshopsPopBullseyeAttendeeModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopBullseyeQuickReportModal(data, $uibModal);

    $scope.ViewReport = function (item) {
        $state.go("reports.bullseye", { uuid: item });
    }
}



function WorkshopsBullseyeAttendeeCtrl($scope, $http, Alert, $rootScope, $uibModal, WorkshopBullseyeAPI, GraphJS, $state) {
    //Get Bullseyes
    $scope.search = '';
    $scope.Getting = true;
    WorkshopBullseyeAPI.GetAttendeeBullseyes($rootScope.Person.properties.uuid)
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



function WorkshopsConnectBullseyeCtrl($scope, sweetAlert, Alert, GraphJS, WorkshopBullseyeAPI, SharedAPI, $uibModalInstance, bullseye_uuid) {
    $scope.cancel = function () {
        $uibModalInstance.close();
    }
    $scope.Getting = true;
    $scope.finalData = null;
    WorkshopBullseyeAPI.GetBullseyeConnections(bullseye_uuid).then(function (result) {
        $scope.Getting = false;
        $scope.bullseye_connections = result;
    })

    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopBullseyeQuickReportModal(data, $uibModal);

    $scope.setsubgraph = function(data) {
        $scope.finalData = data;
    }

    $scope.submit = function () {
        $scope.posting = true;

        console.log(JSON.stringify($scope.finalData));
        WorkshopBullseyeAPI.SetBullseyeConnections($scope.finalData, bullseye_uuid)
        .then(function (res) {
            console.log(res);
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
