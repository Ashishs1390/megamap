app.service('WorkshopBullseyeAPI', function ($http, $rootScope, GraphAPI) {
  const API_URL = GraphAPI.API_URL + "bullseye/";
  return {
    SetBullseyeConnections: function (subgraphs) {
      // console.log("http.query: " + path);
      return $http.put(API_URL + "connections", subgraphs)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    GetBullseyeStrategydata: function(id,personuuid){
      return $http.get(API_URL + "workshop/" + id + "/" + personuuid)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },

    PostBulleyesComments:function(obj){
      return $http({method:"POST",url:API_URL + "workshop/comments",headers:{'bullseye':obj.bullseyeId}, data: obj })
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
    DeleteBulleyesComment:function(obj){
      let {intersectionuuid,commentid,bullseyeid} = obj;
      return $http({method:'DELETE',url: API_URL + `workshop/intersection/${intersectionuuid}/comments/${commentid}`,
      headers: {
              'bullseye': bullseyeid
      }})
      .then(function(){
        console.log("pass");
      }).catch(function(){
        console.log("fail");

      });
    },

    GetBullseyeComments:function(){
        return $http.get(API_URL + "workshop/comments")
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
    
    PostBullseyeStrategydata: function(bullseyeuuid, intersectionuuid, data){
      return $http.post(API_URL + "workshop/" + bullseyeuuid + "/"+intersectionuuid, data)
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
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
      return $http.get(API_URL + "tenant")
        .then(function (resp) {
          if (resp.status == 200) return resp.data;
          return;
        }).catch(function (err) {
          throw err.data;
        })
    },
    GetAdminBullseyes: function (id) {
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
