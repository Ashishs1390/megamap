app.service('NodeAPI', function ($http, GraphAPI) {
  const API_URL = GraphAPI.API_URL + "node/";
  return {
    GetAll: function (label) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "all/" + label)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetAuthored: function (label, author_uuid) {
      // console.log("http.query: " + path);
      return $http.get(API_URL + "authored/" + label + "/" + author_uuid)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
    GetAllNodesByLabel: function (label) {
      return $http.get(API_URL + 'all/' + label)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data
        });
    },
    
    GetAllNodesByLabelWhere: function (label, where_key, where_val, where_type) {
      return $http.get(API_URL + 'search/' + label + "/" + where_key + "/" + where_val + "/" + where_type)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data
        });
    },
    GetLocalSubGraph: function (uuid) {
      return $http.get(API_URL + 'subgraph/' + uuid)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data
        });
    },
    GetSubGraphs: function (uuid_array) {
      return $http.get(API_URL + 'subgraphs/' + uuid_array.join(","))
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data
        });
    },
    Relate: function (data) {
      return $http.post(API_URL + 'relate', data)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data
        });
    },

    GetRelationsOfType: function (from_id, rel_type, to_id) {
      return $http.get(API_URL + 'relations/' + from_id + "/" + rel_type + "/" + to_id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data
        });
    },

    SetSegmentConnections: function (subgraphs) {
      // console.log("http.query: " + path);
      return $http.post(GraphAPI.API_URL + "segment/connections", subgraphs)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetSegmentConnections: function (id) {
      // console.log("http.query: " + path);
      return $http.get(GraphAPI.API_URL + "segment/connections/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    SetPersonaConnections: function (subgraphs) {
      // console.log("http.query: " + path);
      return $http.post(GraphAPI.API_URL + "persona/connections", subgraphs)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetPersonaConnections: function (id) {
      // console.log("http.query: " + path);
      return $http.get(GraphAPI.API_URL + "persona/connections/" + id)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    }

  }
});
