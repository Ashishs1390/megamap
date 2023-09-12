app.factory('subdomain', function ($location) {
  var host = $location.host();
  if (host.indexOf('.') < 0){
    return (host.split('.').length > 2 ? host.split('.')[0] : null)
  } else {
    return null;
  }
});
