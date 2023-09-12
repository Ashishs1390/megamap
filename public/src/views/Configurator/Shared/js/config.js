app.controller('editNodeCtrl', editNodeCtrl)
app.controller('deleteNodeCtrl', deleteNodeCtrl)
app.controller('createNodeCtrl', createNodeCtrl)
app.controller('csvCtrl', csvCtrl)
app.directive('smallCard', smallCard)


function uploadCsvModal($uibModal, journey, onSuccess) {
  var modalInstance = $uibModal.open({
    templateUrl: 'views/Configurator/Shared/csv.html',
    controller: "csvCtrl",
    resolve: {
      journey: function() {
        return journey
      },
      onSuccess: function () {
        return onSuccess;
      }
    }
  });
}


function PopCreateModal(label, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Configurator/Shared/create.html',
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

function PopEditModal(label, uuid, $uibModal, onSuccess) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Configurator/Shared/edit.html',
        controller: "editNodeCtrl",
        resolve: {
            label: function () {
                return label;
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

function smallCard() {
    return {
        restrict: 'E',
        replace: false,
        templateUrl: 'views/Configurator/Shared/sm-card.html',
        scope: {
            node: '=',
            icon: '=?',
            subgraph:'=?',
            hide: '=?',
            badge: '=?',
            recent: '=?'
        }
    }
}
