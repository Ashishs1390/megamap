app.service('JourneyAPI', function ($http, $rootScope, GraphAPI) {
  const API_URL = GraphAPI.API_URL + "journey/";
  return {
    SetJourneyConnections: function (subgraphs) {
      console.log(subgraphs)
      // console.log("http.query: " + path);
      return $http.post(API_URL + "connections", subgraphs)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetAllNodesByLabel: function (label , isLimit) {
     
  },

    GetJourneyConnections: function (id , getNodesWithouNotes) {
      // console.log("http.query: " + path);
      if(getNodesWithouNotes){ // this flag is added as we dont want notes in API response on component click
        let params = {
          getNodesWithouNotes : getNodesWithouNotes
        }
        return $http({ method: 'GET', url: API_URL + 'connections/' + id, params })
        .then(function (resp) {
            if (resp.status == 200) return resp.data;
            return;
        }).catch(function (err) {
            throw err.data
        });
      }else{
        return $http.get(API_URL + "connections/" + id)
          .then(function (resp) {
            if (resp.status == 200) return resp.data;
            return;
          }).catch(function (err) {
            throw err.data;
          })
      }
    },
    GetJourneyConnectionsNew: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "connector/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetAttendeeJournies: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "attendee/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
     PostRemoveLocal: function (data,id) {
        console.log(data)
        return $http({method:'post',url: API_URL + "attendee/removelocal/"+id, data})
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetTenantJournies: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "tenant/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
    GetAdminJournies: function (id) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "admin/" + id)
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

    // $http({ method: 'GET', url: API_URL + 'connections/' + id, params });
    GetJourneyInvitees: function (id, external = false,params) {
      // console.log("http.query: " + path);
      return $http({method:'get',url: API_URL + "invitees/" + id + '?external=' + external, params})
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    }
  }
});
