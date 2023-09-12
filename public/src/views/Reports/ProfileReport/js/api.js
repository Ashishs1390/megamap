app.service('ProfileReportAPI', function ($http, $rootScope, GraphAPI) {
    const API_URL = GraphAPI.API_URL + "profile/";
    return {
        SyncProfileReport: function (id) {
            // console.log("http.query: " + path);
            return $http.get(API_URL + id)
                .then(function (resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function (err) {
                    throw err.data;
                })
        },

    }
});
