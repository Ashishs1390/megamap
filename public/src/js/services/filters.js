// filters

app.filter('titleCase', function() {
    return function(input) {
      input = input || '';
      return input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };
  });

  app.filter('numKeys', function() {
    return function(json) {
        var keys = Object.keys(json)
        return keys.length;
    }
});

  app.filter('railsFullDate', function() {
    return function(digits) {
       return new Date(digits * 1000);
    }
});

// directives

app.directive('dateObject', function($timeout){
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      ngModel: '='
    },
    link: function (scope, element, attributes, controller) {
      $timeout(function() {
        if(scope.ngModel && scope.ngModel.length > 0) {
          scope.ngModel = new Date(scope.ngModel)
        }
      }, 500)
    }
  }
});
