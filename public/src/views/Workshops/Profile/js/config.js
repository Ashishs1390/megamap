
app.directive('personaProfile', personaProfileDirective);
app.controller('personaProfileCtrl', personaProfileCtrl);

function personaProfileDirective() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'views/Workshops/Profile/persona_profile.html',
  }
}