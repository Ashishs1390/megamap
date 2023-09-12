app.service('ProfileAPI', function ($http, $rootScope, GraphAPI) {
  const API_URL = GraphAPI.API_URL + "profile/";
  return {
    SetProfileConnections: function (subgraphs) {
      // console.log("http.query: " + path);
      return $http.post(API_URL + "connections", subgraphs)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    SyncProfileWorkshop: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
    GetProfileConnections: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "connections/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetAttendeeProfiles: function () {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "attendee/" + $rootScope.Person.properties.uuid)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetTenantProfiles: function () {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "tenant/" + $rootScope.Person.properties.uuid)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
    GetAdminProfiles: function () {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "admin/" + $rootScope.Person.properties.uuid)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },


    GetProfileInvitees: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "invitees/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    }
  }
});
