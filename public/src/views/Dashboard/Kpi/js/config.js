app.controller('kpiTenantCtrl', kpiTenantCtrl);
app.controller('kpiAdminCtrl', kpiAdminCtrl);

app.directive('kpiCardLarge',kpiCardLarge)
function kpiCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Dashboard/Kpi/lg-card.html',
        scope: {
            node: '=',
            library: '='
        }
    }
}

function PopKpiCreateModal(label, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Kpi/create.html',
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

function PopKpiEditModal(uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Kpi/edit.html',
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
