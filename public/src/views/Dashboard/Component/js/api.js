app.service('ComponentAPI', function ($http, $rootScope, GraphAPI, $state) {
  const API_URL = GraphAPI.API_URL + "component/";
  return {


    GetTenantComponents: function (label) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + `tenant/${label}`)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          if(err.status === 404) {
            $state.go('home')
          }
        })
    },
    GetAdminComponents: function (id, label) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + `admin/${id}/${label}`)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          if(err.status === 404) {
            $state.go('home')
          }
        })
    },
  }
});
