app.directive('wizard', wizard)

function wizard() {
    return {
        restrict: 'A',
        replace: false,
        link: function ($scope, elem, attr, $parent) {
             // Initial step
            $scope.step = 1;
            $scope.steps = attr.steps;

            $scope.finalStepCallback = $scope[attr.finalStepCallback];
            // Wizard functions
            $scope.wizard = {
                show: function (number) {
                    $scope.step = number;
                    if ($scope.step == $scope.steps) {
                        if($scope.finalStepCallback) $scope.finalStepCallback();
                    }
                },
                next: function () {
                    $scope.step++;
                    if ($scope.step == $scope.steps) {
                        if($scope.finalStepCallback) $scope.finalStepCallback();
                    }
                },
                prev: function () {
                    $scope.step--;
                }
            };
        }
    }
}