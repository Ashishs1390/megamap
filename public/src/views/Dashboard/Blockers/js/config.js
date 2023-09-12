app.controller('blockersTenantCtrl', blockersTenantCtrl);
app.directive('blockersCardLarge', blockersCardLarge)

function blockersCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Dashboard/Blockers/lg-card.html',
        scope: {
            node: '=',
            library: '=',
            index: '=?'
        }
    }
}

function PopBlockersEditModal(uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Blockers/edit.html',
        controller: "editNodeCtrl",
        resolve: {
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
