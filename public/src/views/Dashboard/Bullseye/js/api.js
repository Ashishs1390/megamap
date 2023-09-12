app.service('BullseyeAPI', function ($http, $rootScope, GraphAPI) {
  const API_URL = GraphAPI.API_URL + "bullseye/";
  return {
    SetBullseyeConnections: function (subgraphs, bullseyeUuid) {
      // console.log("http.query: " + path);
      return $http.put(API_URL + "connections/" + bullseyeUuid, subgraphs)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    SetBullseyeAttendees: function (attendees, bullseyeUuid) {
      // console.log("http.query: " + path);
      return $http.put(API_URL + "attendees/" + bullseyeUuid, {attendees: attendees})
        .then(function (resp) {
          console.log(resp)
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          console.log(err)
          throw err.data;
        })
    },


    GetBullseyeConnections: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "connections/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetBullseyeExecutiveData: function () {
    // console.log("http.query: " + path);
    return $http.get(API_URL + "dashboard")
      .then(function (resp) {
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
    },

    GetAttendeeBullseyes: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "attendee/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetTenantBullseyes: function () {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "dashboard/card")
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
    GetAdminBullseyes: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "dashboard/card")
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetFacilitatorJournies: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "facilitator/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },


    GetBullseyeInvitees: function (id) {
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
