app.controller('capabilityTenantCtrl', capabilityTenantCtrl);
app.controller('capabilityAdminCtrl', capabilityAdminCtrl);

app.directive('capabilityCardLarge',capabilityCardLarge)
function capabilityCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Dashboard/Capability/lg-card.html',
        scope: {
            node: '=',
            library: '='
        }
    }
}

function PopCapabilityCreateModal(label, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Capability/create.html',
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

function PopCapabilityEditModal(uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Capability/edit.html',
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
