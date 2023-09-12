app.controller('profileAttendeeCtrl', profileAttendeeCtrl);
app.controller('profileTenantCtrl', profileTenantCtrl);
app.controller('profileAdminCtrl', profileAdminCtrl);
app.controller('connectProfileCtrl', connectProfileCtrl);

app.directive('profileCardLarge', profileCardLarge)

function profileCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Dashboard/Profile/lg-card.html',
        scope: {
            node: '=',
            library: '='
        }
    }
}

function PopProfileAttendeeModal(uuid, $uibModal) {
    $uibModal.open({
        templateUrl: 'views/Dashboard/Profile/invite.html',
        controller: inviteProfileCtrl,
        resolve: {
            profile_uuid: function() {
                return uuid;
            }
        }
    });
}

function PopProfileCreateModal(label, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Profile/create.html',
        controller: "createNodeCtrl",
        resolve: {
            label: function() {
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

function PopProfileEditModal(uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Profile/edit.html',
        controller: "editNodeCtrl",
        resolve: {
            label: function () {
                return null;
            },
            uuid: function() {
                return uuid;
            },
            dynamicFields: function () {
                return false;
            },
            workshopType: function () {
                return null;
            },
            onSuccess: function() {
              return onSuccess

            }
        }
    });
}


function PopProfileConnectModal(uuid, $uibModal) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Profile/connect.html',
        controller: connectProfileCtrl,
        resolve: {
            profile_uuid: function() {
                return uuid;
            }
        }
    });
}

function PopProfileQuickReportModal(uuid, $uibModal) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Profile/quick_report.html',
        controller: profileQuickReportCtrl,
        resolve: {
            profile_uuid: function() {
                return uuid;
            }
        }
    });
}
