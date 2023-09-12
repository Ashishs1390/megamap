app.factory('Auth', function($http, $state, $localStorage, $rootScope, msalAuthenticationService, $q, AuthAPI, $location){

  self.setPersonScope = function(data) {
    return $q(function(resolve, reject){
      $rootScope.Person = data.user;
      if($rootScope.Person) {
        if ($rootScope.Person.properties.tenant) {
          $rootScope.Person.role = 'tenant';
        } else if ($rootScope.Person.properties.admin) {
          $rootScope.Person.role = 'admin';
        } else if ($rootScope.Person.properties.external) {
          $rootScope.Person.role = 'external';
        } else {
          $rootScope.Person.role = 'attendee';
        }
        let profile_image = $rootScope.Person.properties.image_url;
        if (!profile_image || profile_image.length < 1) {
          $rootScope.Person.properties.image_url = '/build/images/user-default.png';
        }
        resolve($rootScope.Person);
      }
      else {
        resolve()
      }
    })
  },
  // Self Service
  self.selfService = () => {
    $localStorage.selfService = true;

    msalAuthenticationService.loginRedirect();
  },
  self.navigateToLogin = () => {
    localStorage.clear()
    location.reload()

    $rootScope.logout()
  },
  // Register/Login
  self.authenticate = function( body, redirect = true ){
    var login = function() {
      body.properties.last_login = Date.now()

      return $http.post('/api/auth/authenticate', body)
      .then(function(resp){
        if(body.authType === 'register') {
          $state.go('dashboard.users');

        } else if(body.authType !== 'selfservice') {
          $localStorage.token = resp.data.token;

          return self.setPersonScope(resp.data).then(function(person){
            $localStorage.currentUser = person;
            return resp;
          })
        }
      }).catch(function(err) {
        console.log(err)
        return err
      });
    }

    if( !body && redirect ) {
      $localStorage.msal = true;
      msalAuthenticationService.loginRedirect();
      return Promise.resolve()
    }
    else {
      return $http.get('https://ipinfo.io?token=68e1960b124336')
      .then(function(resp) {
        body.properties.last_login_ip = resp.data.ip;
        body.properties.last_login_coordinates = resp.data.loc;

        return login()
      })
      .catch(function(err){
        console.log(err)

        return login()
      });
    }
  },
  // Get Current User
  self.current = function(){
    return $http.get('/api/auth/current')
    .then(function(resp){
      if(resp.status == 200){
        return resp.data;
      } else {
        delete $localStorage.token;
        return {};
      };
    }).catch(function(err){
      delete $localStorage.token;
      return err;
    });
  }
  // validate token
  self.validate = function(){
    return $q(function(resolve, reject){
      if($localStorage.currentUser){
        $rootScope.Person = $localStorage.currentUser;
        resolve('valid user');
      } else if($localStorage.token){
        self.current().then(function(user){
          self.setPersonScope(user).then(function(person){
            $localStorage.currentUser = person;
            resolve('valid user');
          })
        }).catch(function(err){
          $rootScope.Person = undefined;
          reject('invalid user');
        });
      } else {
        $rootScope.Person = undefined;
        reject('invalid user');
      };
    })
  }

  self.validateTenant = function() {
    self.validate().then(function() {
      if($localStorage.currentUser.role !== 'tenant') {
        $state.go('home');
      }
    }).catch(function() {
      $rootScope.logout();
    })
  }

  self.activate = function(token){
    return $http.post('/api/auth/activate', {
      token: token
    }).then(function(resp){
      return resp.data;
    }).catch(function(err){
      return err;
    })
  }

  self.update = function(body){
    return $http.put('/api/auth/update', body)
    .then(function(resp){
      if(resp.data.token) {
        $localStorage.token = resp.data.token;
      }
      var user = resp.data.nodes[resp.data.node_label_index.Person[0]]
      return self.setPersonScope({user: user}).then(function(person){
        $localStorage.currentUser = person;
        return resp;
      })
    }).catch(function(err){return err});
  }

  return self;
});
