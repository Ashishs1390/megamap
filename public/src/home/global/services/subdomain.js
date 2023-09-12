app.service('Subdomain', function($location) {
    var host = $location.host();

    if (host.indexOf('.') >= 0) {
      return host.split('.')[0];
    } else {
      return false;
    }
  }
);
