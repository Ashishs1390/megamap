
app.controller('nodeTenantCtrl', nodeTenantCtrl);
app.controller('nodeAdminCtrl', nodeAdminCtrl);
app.controller('nodeAttendeeCtrl', nodeAttendeeCtrl);
app.controller('focusNodeCtrl', focusNodeCtrl);
app.controller('focusCardCtrl', focusCardCtrl );
app.controller('searchCard', searchCard );
app.controller('searchCardCtrl', searchCardCtrl );

app.controller('nodeConnectCtrl', nodeConnectCtrl);
app.controller('connectorCtrl', connectorCtrl);
app.controller('connectorCardCtrl', connectorCardCtrl );



app.directive('focusCard', focusCard);

app.directive('connectorCard', connectorCard);

app.directive('nodeCardLarge', nodeCardLarge);
app.directive('nodeCardSmall', nodeCardSmall);


function nodeCardLarge() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Configurator/Models/lg-card.html',
        scope: { node: '=' , library:'=', label:'='},
    }
}
function nodeCardSmall() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Configurator/Models/sm-card.html',
        scope: { node: '=' , library:'=', label:'='},
    }
}
function focusCard() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Configurator/Models/focus-card.html',
        scope: { node: '=', and:'=?', or:"=?",remove:"=?"},
        controller:focusCardCtrl
    }
}
function connectorCard() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Configurator/Models/connector-card.html',
        scope: { node: '='},
        controller:connectorCardCtrl
    }
}
function searchCard() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Configurator/Models/search-card.html',
        scope: { node: '=', and:'=?', or:"=?"},
        controller:searchCardCtrl
    }
}

function PopConnectModal(uuid, $uibModal) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Configurator/Models/connect-segment.html',
        controller: 'nodeConnectCtrl',
        resolve: {
            uuid: function () {
                return uuid;
            }
        }
    });
}

function PopConnectPersonaModal(uuid, $uibModal) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Configurator/Models/connect-persona.html',
        controller: nodePersonaConnectCtrl,
        resolve: {
            uuid: function () {
                return uuid;
            }
        }
    });
}

function PopNodeOverviewModal(uuid, $uibModal) {
    var modalInstance = $uibModal.open({
        templateUrl: 'views/Configurator/Models/overview.html',
        controller: nodeOverviewCtrl,
        resolve: {
            uuid: function () {
                return uuid;
            }
        }
    });
}
