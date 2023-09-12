$(function () {
  $('uib-popover').popover()
})

angular.module('workshop', [
  'ui.router',
  'MsalAngular',
  'ui.bootstrap',
  'ngStorage',
  'cgNotify',
  'angular-ladda',
  'ui.sortable',
  'signature',
  "chart.js",
  "summernote",
  "rzModule",
  'angular-screenshot',
  'gridshore.c3js.chart',
  'btorfs.multiselect',
  'ngclipboard',
  'infinite-scroll',
  'bw.paging',
  'angularMoment',
  'angularjs-autogrow',
  'ngFileUpload',
  'ejangular',
  'ui.multiselect',
  'pubnub.angular.service'
]);

const app = angular.module('workshop');

app.run(function ($rootScope, $state, $uibModal, $http, $location, $localStorage, GraphJS, GraphAPI, Auth, loader, $window, UITracking, Pubnub) {
  $rootScope.loadingJourney = false;
  $rootScope.edgeBrowser = false;
  $rootScope.subdomain = undefined;
  $rootScope.ssoUser = $localStorage.msal;

  // listen to real-time data push
  $rootScope.fayeClient = new $window.Faye.Client('https://a1968972.fanoutcdn.com/bayeux');

  Pubnub.init({
  	publishKey: 'pub-c-1be4bf40-5cf0-4daa-995c-592ef7e5b160',
  	subscribeKey: 'sub-c-e10759f2-730c-11ea-bbea-a6250b4fd944'
  });

  if ($window.navigator.userAgent.indexOf("Edge") > -1) {
    $rootScope.edgeBrowser = true;
  }
  if ($window.location.host.split('.').length > 2) {
    $rootScope.subdomain = $window.location.host.split('.')[0];

    //  Get app config
    $http.get('https://ruptivefiles.blob.core.windows.net/config/ruptive1x.json')
    .then( resp => {
      $rootScope.config = ( resp.data[$rootScope.subdomain] || {})
    })
  }

  // Auth.setUserScope();
  // "grey" and "orange" are still in css, but they are not going to be available in $root.
  // orange(aka yellow) will be default color if user didn't select a color for note and interaction
  $rootScope.colors = ["yellow" , "orange", "red", "pink", "purple", "indigo", "blue", "teal", "green", "brown", "blue-grey"];
  $rootScope.$state = $state;
  $rootScope.loader = loader;
  $rootScope.previousState = null;
  let currentState = null;
  let currentParams = null;
  let previousParams = null;
  $rootScope.$on('$stateChangeStart', function (ev, to, toParams, from, fromParams) {
    if (to.name === 'workshop.journey') {
      $rootScope.loadingJourney = true;
    }
  });
  $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
    $rootScope.previousState = from.name;
    $rootScope.previousParams = fromParams;
    currentState = to.name;
    currentParams = toParams;
    // console.log('Previous state:' + $rootScope.previousState)
    // console.log('Current state:' + currentState)
  });

  $rootScope.SetRole = function (desired_role) {
    $rootScope.Person.properties.power_user = false;

    if (desired_role == "attendee") $rootScope.Person.role = "attendee";
    if (desired_role == "external") $rootScope.Person.role = "external";
    if (desired_role == "power_user") {
      $rootScope.Person.role = "attendee";
      $rootScope.Person.properties.power_user = true;
    }
    if (desired_role == "admin" && $rootScope.Person.properties.admin) $rootScope.Person.role = "admin";
    if (desired_role == "tenant" && $rootScope.Person.properties.tenant) $rootScope.Person.role = "tenant";
    $state.reload();
  }

  $rootScope.$on('loading:start', function () {
    $rootScope.isLoading = true;
  });
  $rootScope.$on('loading:finish', function () {
    $rootScope.isLoading = false;
  });
  $rootScope.$on('loading:blocked', function () {
    let view = document.querySelector('#wrapper [ui-view]')

    view.innerHTML = '<div style="padding:25px;max-width:800px"><h4>Hello,<br/><br/>If you have reached this page upon login, please verify that you have an active subscription and reach out to ruptivehelpdesk@indigoslate.com for assistance.<br/><br/>Thank you.</h4></div>'
  });

  $rootScope.href = function (url) {
    $window.open(url, '_blank')
  }
  $rootScope.go = function (state, params = {}) {
    $state.go(state, params)
  }
  $rootScope.range = function (n) {
    return Array.apply(null, Array(n)).map(function (_, i) { return i + 1; });
  }

  $rootScope.getPrivacyPolicyUrl = function() {
    if($rootScope.Person.properties.email) {
      var domain = $rootScope.Person.properties.email.split('@')[1]

      if(domain === 'microsoft.com') {
        return 'https://msdpn.azurewebsites.net/default?LID=62';
      }
      else {
        return 'https://aka.ms/privacy'
      }
    }
  }

  $rootScope.logout = function() {
      $window.localStorage.clear()

      $window.location.href = '/login';
  }

  // UITracking.start();
});

app.config(function ($httpProvider) {
  //disable IE ajax request caching
  $httpProvider.defaults.headers.common['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
  // extra
  $httpProvider.defaults.headers.common['Cache-Control'] = 'no-cache';
  $httpProvider.defaults.headers.common['Pragma'] = 'no-cache';
  // set journey in header
})

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
