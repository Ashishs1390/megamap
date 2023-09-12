app.service('MotAPI', function ($http, $rootScope, GraphAPI) {
  const API_URL = GraphAPI.API_URL + "mot/";
  return {


    GetTenantMots: function () {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "tenant/")
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
    GetAdminMots: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "admin/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
  }
});
