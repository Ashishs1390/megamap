app.service('ProfileWorkshopAPI', function ($http, $rootScope, GraphAPI) {
    const API_URL = GraphAPI.API_URL + "profile/";
    return {
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
            return $http.post(API_URL + 'note', post_data)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
        },

        UpdateNote: function (post_data) {
            return $http.put(API_URL + 'note', post_data)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
        },
        PostVote: function (vote) {
            return $http.post(API_URL + 'note/vote', vote)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
        },
        DeleteVote: function (uuid) {
            return $http.delete(API_URL + 'note/vote/' + uuid)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
        },

        PostComment: function (rel) {
            return $http.post(API_URL + 'note/comment', rel)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
        },
        Pain: function (vote) {
            return $http.post(API_URL + 'note/vote', vote)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
        },
        DeleteNote: function (uuid) {
            return $http.delete(API_URL + 'note/' + uuid)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
        }
    }
});
