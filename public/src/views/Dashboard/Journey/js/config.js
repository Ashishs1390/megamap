app.controller('journeyAttendeeCtrl', journeyAttendeeCtrl);
app.controller('journeyTenantCtrl', journeyTenantCtrl);
app.controller('journeyAdminCtrl', journeyAdminCtrl);
app.controller('connectJourneyCtrl', connectJourneyCtrl);
app.controller('journeyQuickReportCtrl', journeyQuickReportCtrl);

app.directive('journeyCardLarge', journeyCardLarge)
function journeyCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Dashboard/Journey/lg-card.html',
        scope: {
            node: '=',
            library: '='
        }
    }
}

function PopJourneyAttendeeModal(journey, external, $uibModal) {
    $uibModal.open({
        templateUrl: 'views/Dashboard/Journey/invite.html',
        controller: inviteJourneyCtrl,
        backdrop: 'static',
        keyboard: false,
        resolve: {
            journey: journey,
            external: external
        }
    });
}
function PopJourneyCreateModal(label, dynamicFields, $uibModal, workshopType, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Journey/create.html',
        controller: "createNodeCtrl",
        backdrop: 'static',
        keyboard: false,
        resolve: {
            label: function () {
                return label;
            },
            dynamicFields: function () {
                return dynamicFields;
            },
            workshopType: function() {
                return workshopType;
            },
            onSuccess: function () {
                return onSuccess;
            }
        }
    });
}

function PopJourneyEditModal(uuid, dynamicFields, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Journey/edit.html',
        controller: "editNodeCtrl",
        backdrop: 'static',
        keyboard: false,
        resolve: {
            label: function () {
                return 'journey';
            },
            uuid: function () {
                return uuid;
            },
            dynamicFields: function () {
                return dynamicFields;
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


function PopJourneyConnectModal(uuid, $uibModal) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Journey/connect.html',
        controller: 'connectJourneyCtrl',
        backdrop: 'static',
        keyboard: false,
        resolve: {
            journey_uuid: function () {
                return uuid;
            }
        }
    });
}


function PopJourneyQuickReportModal(uuid, $uibModal, size) {
    // Open modal in larger size
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Journey/quick_report.html',
        size: size,
        controller: 'journeyQuickReportCtrl',
        backdrop: 'static',
        keyboard: false,
        resolve: {
            journey_uuid: function () {
                return uuid;
            }
        }
    });
}
