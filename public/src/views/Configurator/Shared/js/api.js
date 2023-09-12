app.service('SharedAPI', function ($http, GraphAPI ,$rootScope) {
    const API_URL = GraphAPI.API_URL;
    return {
        PostNode: function (post_data) {
            return $http.post(API_URL + 'node', post_data)
            .then((resp) => {
                if (resp.status == 200) return resp.data;
                return;
            }).catch((err) => {
                console.log(err);
                throw err.data;
            });
        },

        GetNode: function (id , isProjectNotes) {
            if(isProjectNotes){
                return $http.get(API_URL + 'project/' + id)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
            }else{
                return $http.get(API_URL + 'node/' + id)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data
                });
            }
        },

        DeleteNode: function (id, headers) {
            let req = {
              method: 'DELETE',
              url: API_URL + 'node/' + id,
              headers: headers
            }
            return $http(req).then(function (resp) {
                if (resp.status == 200) return resp.data;
                return;
            }).catch(function (err) {
                throw err.data
            });
        },

        UpdateNode: function (Update) {
            return $http.put(API_URL + 'node', Update)
            .then(function (resp) {
                if (resp.status == 200) return resp.data;
                return;
            }).catch(function (err) {
                throw err.data
            });
        },
        GetAllAudienceSegments: function () {
          return $http.get(API_URL + 'node/all/audience/segment')
            .then(function (resp) {
              if (resp.status == 200) return resp.data;
              return;
            }).catch(function (err) {
              throw err.data
            });
        },
        GetALLSearchNodes: function(label ,searchTerm, isLimit,journeyuuid){
            let params = {
                    isLimit : isLimit,
                    journeyuuid:journeyuuid,
                    searchTerm:searchTerm
                }
             // console.log(API_URL + 'node/all/search/'+label);
             return $http({ method: 'GET', url: API_URL + 'node/all/search/'+label, params })
            .then(function (resp) {
                if (resp.status == 200) return resp.data;
                return;
            }).catch(function (err) {
                throw err.data
            });

        },
        GetAllNodesByLabel: function (label ,searchTerm, isLimit,journeyuuid) {
            console.log('GetAllNodesByLabel')
            if(searchTerm == ''){
                searchTerm = 'undefined';
            }
            let params = {
                isLimit : isLimit,
                searchTerm:searchTerm,
                journeyuuid:journeyuuid
            }
            if(label == 'Journey' && $rootScope.projectInfoForNotes && $rootScope.Person.role != "tenant"){
                params = {
                    isProjectJourney : true,
                }
            }else{
                params = {
                    isLimit : isLimit,
                    journeyuuid:journeyuuid,
                    searchTerm:searchTerm

                }
            }


            return $http({ method: 'GET', url: API_URL + 'node/all/'+label, params })
            .then(function (resp) {
                if (resp.status == 200) return resp.data;
                return;
            }).catch(function (err) {
                throw err.data
            });
        },
        GetFacilitator:function(params){

            return $http({ method: 'GET', url: API_URL + 'node/all/added', params })
                .then(function (resp) {
                if (resp.status == 200){
                    return resp.data;
                }
                return;
            }).catch(function (err) {
                throw err.data
            });
        },
        GetAddedAttendee:function(params){
            return $http({ method: 'GET', url: API_URL + 'node/all/addedattendee', params })
                .then(function (resp) {
                if (resp.status == 200){
                    return resp.data;
                }
                return;
            }).catch(function (err) {
                throw err.data
            });
        },
        GetAttendee:function(params){
            return $http({ method: 'GET', url: API_URL + 'node/all/attendee', params })
                .then(function (resp) {
                if (resp.status == 200){
                    return resp.data;
                }
                return;
            }).catch(function (err) {
                throw err.data
            });
        },
         GetAttendeeCount:function(params){

            return $http({ method: 'GET', url: API_URL + 'node/all/attendee/count',params })
                .then(function (resp) {
                if (resp.status == 200){
                    return resp.data;
                }
                return;
            }).catch(function (err) {
                throw err.data
            });
        },
        GetMostUsedByLabel : function(label){
            return $http.get(API_URL + 'node/all/getmostused/'+label)
              .then(function (resp) {
                if (resp.status == 200) return resp.data;
                return;
              }).catch(function (err) {
                throw err.data
              });
          },

        GetAllNodesByLabelWhere: function (label, where_key, where_val, where_type) {
            return $http.get(API_URL + 'node/where/'+label+"/"+where_key +"/"+where_val+"/"+where_type)
            .then(function (resp) {
                if (resp.status == 200) return resp.data;
                return;
            }).catch(function (err) {
                throw err.data
            });
        }
    }
});
