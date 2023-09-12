
app.config(function($sceProvider, $httpProvider, msalAuthenticationServiceProvider){
  var redirectPaths = [
    '/self-service',
    '/login'
  ]
  var redirectPath = (redirectPaths.includes(location.pathname) ? location.pathname : '/login')

  // prevent browsers(IE) from caching $http responses
  if (!$httpProvider.defaults.headers.get) {
    $httpProvider.defaults.headers.get = {
      'Cache-Control':'no-cache',
      'Pragma':'no-cache'
    };
  };

  $sceProvider.enabled(false);

  // Inject auth token into the headers of each request
  $httpProvider.interceptors.push(function($q, $location, $localStorage, $rootScope) {
    return {
      request: function(config) {
        $rootScope.$broadcast('loading:start');
        // send token header with requests
        config.headers = config.headers || {};
        if ($localStorage.token) {
          config.headers.token = $localStorage.token;
        }
        return config || $q.when(config);
      },
      response: function (response) {
        $rootScope.$broadcast('loading:finish');
        if(response.status === 204) {
          $rootScope.$broadcast('loading:blocked');
        }
        return response || $q.when(response);
      },
      responseError: function(response) {
        $rootScope.$broadcast('loading:finish');
        if(response.status === 403) {
          delete $localStorage.token;
          delete $localStorage.currentUser;
          $location.path('/login');
        }
        return $q.reject(response);
      }
    };
  });

  var redirectUri = function(path) {
    if(window.location.port) {
      return 'http://localhost:'+window.location.port+path;
    } else {
      return 'https://'+window.location.host+path;
    }
  }

  msalAuthenticationServiceProvider.init({
      clientID: '592e0b94-dd3d-48e5-9a9e-61691718b65d',
      authority: 'https://login.microsoftonline.com/organizations',
      tokenReceivedCallback: function (errorDesc, token, error, tokenType) {
        // console.log(errorDesc, token, error, tokenType)
        if(error) {
          localStorage.clear()
          localStorage.setItem('msal.stop', true);
          location.reload(true);
        }
      },
      optionalParams: {
          cacheLocation: 'localStorage',
          validateAuthority: true,
          redirectUri: redirectUri(redirectPath),
          navigateToLoginRequestUrl: false,
          postLogoutRedirectUri: redirectUri('/logout'),
          unprotectedResources : [],
          storeAuthStateInCookie: false
      },
  });

});
