app.service('AuthAPI', function ($http, GraphAPI) {
    const API_URL = GraphAPI.API_URL + "auth/";
    return {
        PostUser: function (user_data) {
            return $http.post(API_URL, user_data)
                .then((resp) => {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch((err) => {
                    console.log(err);
                    throw err.data;
                });
        },
             GetUser: function (uuid) {
            return $http.get(API_URL + uuid)
                .then((resp) => {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch((err) => {
                    console.log(err);
                    throw err.data;
                });
        },
    }
});