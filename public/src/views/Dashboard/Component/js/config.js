app.controller('componentTenantCtrl', componentTenantCtrl);
app.controller('componentAdminCtrl', componentAdminCtrl);

app.directive('componentCardLarge',componentCardLarge)
function componentCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Dashboard/Component/lg-card.html',
        scope: {
            node: '=',
            library: '='
        }
    }
}

function PopComponentCreateModal(label, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Component/create.html',
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

function PopComponentEditModal(uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Component/edit.html',
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
