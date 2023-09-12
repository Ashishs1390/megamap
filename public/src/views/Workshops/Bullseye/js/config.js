app.directive('bullseye', BullseyeDirective);
app.controller('workshopsBullseyeAttendeeCtrl', WorkshopsBullseyeAttendeeCtrl);
app.controller('workshopsBullseyeTenantCtrl', WorkshopsBullseyeTenantCtrl);
app.controller('workshopsBullseyeAdminCtrl', WorkshopsBullseyeAdminCtrl);
app.controller('workshopsConnectBullseyeCtrl', WorkshopsConnectBullseyeCtrl);
app.controller('workshopbullseyeCtrl', workshopbullseyeCtrl);

function BullseyeDirective() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/Workshops/Bullseye/bullseye.html',
    }
}

app.directive('workshopsBullseyeCardLarge', bullseyeCardLarge)
function workshopsBullseyeCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Workshops/Bullseye/lg-card.html',
        scope: {
            node: '=',
            library: '='
        }
    }
}

function WorkshopsPopBullseyeAttendeeModal(uuid, $uibModal) {
    $uibModal.open({
        templateUrl: 'views/Workshops/Bullseye/invite.html',
        controller: 'inviteBullseyeCtrl',
        resolve: {
            bullseye_uuid: function () {
                return uuid;
            }
        }
    });
}
function WorkshopsPopBullseyeCreateModal(label, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Workshops/Bullseye/create.html',
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

function WorkshopsPopBullseyeEditModal(uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Workshops/Bullseye/edit.html',
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


function WorkshopsPopBullseyeConnectModal(uuid, $uibModal) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Workshops/Bullseye/connect.html',
        controller: 'connectBullseyeCtrl',
        resolve: {
            bullseye_uuid: function () {
                return uuid;
            }
        }
    });
}
