app.directive('adminOnly', adminOnly)

function adminOnly($rootScope) {
    return {
        restrict: 'A',
        replace: false,
        terminal:true,
        link: function ($scope,element, attr) {
            $scope.$watch($rootScope.user.admin, function (value, oldValue) {
                if (value) {
                    element.show();
                } else {
                    element.hide();
                }
            }, true);
        }
    }
}