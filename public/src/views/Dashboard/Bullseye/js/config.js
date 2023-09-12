app.controller('bullseyeAttendeeCtrl', bullseyeAttendeeCtrl);
app.controller('bullseyeTenantCtrl', bullseyeTenantCtrl);
app.controller('bullseyeAdminCtrl', bullseyeAdminCtrl);
app.controller('connectBullseyeCtrl', connectBullseyeCtrl);
app.controller('dashboardbullseyeCtrl', dashboardbullseyeCtrl);


app.directive('bullseyeCardLarge', bullseyeCardLarge)
function bullseyeCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Dashboard/Bullseye/lg-card.html',
        scope: {
            node: '=',
            library: '=',
            params: '='
        },
        controller: function($scope, $location, $rootScope) {
          if($location.path().includes('bullseye')) {
            $scope.clickFunc = () => {
              $rootScope.go('workshop.bullseye', $scope.params)
            }
          }
        }
    }
}

function PopBullseyeAttendeeModal(uuid, $uibModal) {
    $uibModal.open({
        templateUrl: 'views/Dashboard/Bullseye/invite.html',
        controller: inviteBullseyeCtrl,
        resolve: {
            bullseye_uuid: function () {
                return uuid;
            }
        }
    });
}
function PopBullseyeCreateModal(label, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Bullseye/create.html',
        controller: "createNodeCtrl",
        resolve: {
            label: function () {
                return label;
            },
            dynamicFields: function () {
                return false;
            },
            workshopType: function () {
                return null;
            },
            onSuccess: function () {
                return onSuccess;
            }
        }
    });
}

function PopBullseyeEditModal(uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Bullseye/edit.html',
        controller: "editNodeCtrl",
        resolve: {
            label: function () {
                return null;
            },
            uuid: function () {
                return uuid;
            },
            dynamicFields: function () {
                return false;
            },
            workshopType: function () {
                return null;
            },
            onSuccess: function () {
                return onSuccess;
            }
        }
    });
}


function PopBullseyeConnectModal(uuid, $uibModal) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Bullseye/connect.html',
        controller: "connectBullseyeCtrl",
        resolve: {
            bullseye_uuid: function () {
                return uuid;
            }
        }
    });
}
