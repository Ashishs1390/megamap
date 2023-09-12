app.controller('motTenantCtrl', motTenantCtrl);
app.controller('motAdminCtrl', motAdminCtrl);

app.directive('motCardLarge',motCardLarge)
function motCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Dashboard/Mot/lg-card.html',
        scope: {
            node: '=',
            library: '='
        }
    }
}

function PopMotCreateModal(label, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Mot/create.html',
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

function PopMotEditModal(uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Mot/edit.html',
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
