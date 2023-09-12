
app.controller('AuthCtrl', function($timeout, $state, $scope, $rootScope, $localStorage, Auth, $stateParams, $window) {
  $scope.loading = true
  $scope.hidesso = true;
  $scope.selfService = $localStorage.selfService;

  $scope.user = { properties: {} }
  $scope.shouldRedirect = false;

  var ssoRedirectList = [
    'indigoslate.com',
    'microsoft.com'
  ]

  $scope.authenticateSelfService = () => {
    $window.localStorage.clear()

    Auth.selfService(false)
  }

  // Authenticate then set currentUser in locastorage
  $scope.authenticate = function( body ) {
    $scope.posting = true;

    if( !$scope.shouldRedirect && body ) $scope.checkForSso( body )

    Auth.authenticate(( $scope.shouldRedirect ? null : body )).then(function( resp ){
      if( resp ) {
        if( resp.status === 200 ){
          $state.go( 'dashboard.journey' );
        } else {
          $scope.error = resp.data;
        }
      }
      $scope.posting = false;
    }).catch(function(err){
      console.error('err',err)
      $scope.posting = false;
    });
  };

  $scope.activate = function(){
    Auth.activate($stateParams.token).then(function(obj){
      $scope.user.properties = obj.info;
    }).catch(function(err){
      console.log(err)
    })
  }


  $scope.redirect = function( ) {
    if($rootScope.userInfo && $rootScope.userInfo.isAuthenticated) {
      $rootScope.userInfo.authType = 'aad';
      $rootScope.userInfo.properties = {};
      $scope.authenticate( $rootScope.userInfo )
    }
    else {
      $scope.authenticate( null, $scope.shouldRedirect )
    }
  }

  $scope.checkForSso = function( body ) {
    if( body.properties.email && ssoRedirectList.includes( body.properties.email.split('@')[1] )) {
      $scope.shouldRedirect = true;
    }
  }

  if( $scope.selfService ) {
    $rootScope.userInfo.authType = 'selfservice';
    $rootScope.userInfo.properties = {};
    $scope.authenticate( $rootScope.userInfo, false )
  }

  else {
    if( $localStorage.msal && !$localStorage.token ) {
      $scope.redirect()
    }

    if( $localStorage.msal && $localStorage.token ) {
      $state.go( 'dashboard.journey' );
    }
  }

  $scope.navigateToLogin = () => {
    // Auth.navigateToLogin()

    $window.localStorage.clear()

    $window.location.href = '/login#authenticate';
  }


  if( $window.location.hash === '#authenticate' ) {
    $state.go('login', {'#': ''})

    $scope.authenticate( null )
  }

  $timeout(() => {
    $scope.loading = false;
  }, 1000)
});
