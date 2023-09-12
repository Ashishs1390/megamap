app.directive('profileReportCard', profileReportCard);
app.controller('profileReportCardCtrl',profileReportCardCtrl);

app.controller('profileReportCtrl',profileReportCtrl);
function profileReportCard() {
    return {
        restrict: 'E',
        templateUrl: 'views/Reports/ProfileReport/generic-card.html',
        scope: {
            index:'=',
            editing:'=',
            stage:'=',
            i:'='
        }
    }
}
