app.service('JourneyWorkshopAPI', function ($http, $rootScope, GraphAPI, $stateParams ) {
    const API_URL = GraphAPI.API_URL + "journey/";
    return {
        SyncJourneyWorkshop: function (id) {
            // console.log("http.query: " + path);
            return $http.get(API_URL + id)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data;
                })
        },
        SetNoteConnections: function (subgraphs) {
            // console.log("http.query: " + path);
            return $http.put(API_URL + "note/connections", subgraphs)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data;
                })
        },
        PostNote: function (post_data) {
          return $http({
            method: 'POST',
            url:  API_URL + 'note',
            data: post_data,
            headers: { 'journey': $stateParams.id }
          })
          .then(function (resp) {
            if (resp.status == 200) return resp.data;
            return;
          }).catch(function (err) {
            throw err.data
          });
        },
        UpdateNote: function (post_data) {
          return $http({
            method: 'PUT',
            url:  API_URL + 'note',
            data: post_data,
            headers: { 'journey': $stateParams.id }
          })
          .then(function (resp) {
            if (resp.status == 200) return resp.data;
            return;
          }).catch(function (err) {
            throw err.data
          });
        },
        UpdateNoteProgress: function (post_data) {
          return $http({
            method: 'PUT',
            url:  API_URL + 'noteprogressupdate',
            data: post_data,
            headers: { 'journey': $stateParams.id }
          })
          .then(function (resp) {
            if (resp.status == 200) return resp.data;
            return;
          }).catch(function (err) {
            throw err.data
          });
        },
        PostVote: function (vote) {
          return $http.post(API_URL + 'note/vote', { data: vote, headers: { 'journey': $stateParams.id } })
            .then(function (resp) {
                if (resp.status == 200) return resp.data;
                return;
            }).catch(function (err) {
                throw err.data
            });
        },
        DeleteVote: function (uuid) {
          return $http({
            method: 'DELETE',
            url:  API_URL + 'note',
            data: post_data,
            headers: {
              'journey': $stateParams.id
            }
          })
          .then(function (resp) {
            if (resp.status == 200) return resp.data;
            return;
          }).catch(function (err) {
            throw err.data
          });
        },

        PostComment: function (rel) {
          return $http({
            method: 'POST',
            url:  API_URL + 'note/comment',
            data: rel,
            headers: { 'journey': $stateParams.id }
          })
          .then(function (resp) {
            if (resp.status == 200) return resp.data;
            return;
          }).catch(function (err) {
            throw err.data
          });
        },
        Pain: function (vote) {
            return $http.post(API_URL + 'note/vote', { data: vote, headers: { 'journey': $stateParams.id } })
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
        },
        DeleteNote: function (uuid, stage_uuid) {
            return $http.delete(API_URL + 'note/' + uuid, {
              headers: {
                'journey': $stateParams.id,
                'stage': stage_uuid
              }})
              .then(function (resp) {
                  if (resp.status == 200) return resp.data;
                  return;
              }).catch(function (err) {
                  throw err.data
              });
        }
    }
});






app.filter("trustUrl", function($sce) {
  return function(Url) {
      return $sce.trustAsResourceUrl(Url);
  };
});
