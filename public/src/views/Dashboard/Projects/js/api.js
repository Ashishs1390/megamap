app.service('ProjectAPI', function ($http, GraphAPI) {
  const API_URL = GraphAPI.API_URL+"project/";
  return {
    GetProject:function(uuid){
      // console.log(uuid)
      return $http.get(API_URL  + uuid)
      .then(function (resp) {
        // console.log(resp.data)
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
    },
    GetProjectPage:function(uuid){
      // console.log(uuid)
      return $http.get(API_URL  +"projectpage/" +uuid)
      .then(function (resp) {
        // console.log(resp.data)
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
    },

    GetTenantProjectsLibraryView:function(uuid){
      return $http.get(API_URL+'tenant/')
      .then(function (resp) {
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
    },

    GetProjectInvitees:function(uuid){
      return $http.get(API_URL + "connections/" + uuid)
      .then(function (resp) {
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
    },
    SetProjectConnections: function(subgraphs) {
      // console.log("http.query: " + path);
      return $http.post(API_URL + "connections", subgraphs)
      .then(function (resp) {
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
    },

    SetProjectTaskConnections: function(subgraphs) {
      // console.log("http.query: " + path);
      return $http.post(API_URL + "taskConnection", subgraphs)
      .then(function (resp) {
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
    },

    SetMilestoneConnections: function(data) {
      return $http.post(API_URL + "milestone/connections/", data)
      .then(function (resp) {
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
    },
    setMilestoneSequence: function(data) {
      return $http.post(API_URL + "milestone/sequence", data)
      .then(function (resp) {
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
      
    },
    GetMilestoneConnections: function(uuid) {
      return $http.get(API_URL + "milestone/connections/"+uuid)
      .then(function (resp) {
        if (resp.status == 200) return resp.data;
        return;
      }).catch(function (err) {
        throw err.data;
      })
    },

    DeleteNode: function (id, headers) {
      let req = {
        method: 'DELETE',
        url: API_URL + 'milestone/connections/' + id,
        headers: headers
      }
      return $http(req).then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
      }).catch(function (err) {
          throw err.data
      });
    },
  }
});
