app.directive('journeyReportCard', journeyReportCard);
app.controller('journeyReportCtrl', journeyReportCtrl);
app.controller('journeyMapReportCtrl', journeyMapReportCtrl);

function journeyReportCard() {
    return {
        restrict: 'E',
        templateUrl: 'views/Reports/JourneyReport/generic-card.html',
        scope: {

        }
    }
}