app.service('GraphAPI', function($http, $rootScope) {
    $rootScope.api = '/';
    return {
        API_URL: $rootScope.api + 'api/',
    }
});
