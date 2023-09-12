app.controller('ideasTenantCtrl', ideasTenantCtrl);
app.directive('ideasCardLarge', ideasCardLarge)

function ideasCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Dashboard/Ideas/lg-card.html',
        scope: {
            node: '=',
            library: '=',
            index: '=?'
        }
    }
}

function PopIdeasEditModal(uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Dashboard/Ideas/edit.html',
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
