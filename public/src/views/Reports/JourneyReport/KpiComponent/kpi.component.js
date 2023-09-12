app.component("kpiComponent", {
    bindings: {
        kpi: '<',
        full: '<'
    },
    controller: KPIController,
    template: ['$templateCache', function($templateCache) {
        return $templateCache.get('views/Reports/JourneyReport/KpiComponent/kpi.template.html')
    }]
});

function KPIController() {
    var ctrl = this;

    console.log(ctrl.full)

    ctrl.kpiFirstRow = [];
    ctrl.kpiSecondRow = [];
    ctrl.kpiFullRow = [];

    ctrl.$onChanges = function(componentProperties) {

        createKPIList(ctrl.kpi);
    };
    ctrl.$onInit = function() {

        createKPIList(ctrl.kpi);
    };

    function createKPIList(kpis) {
        if (!kpis || kpis.length <= 0) {
            return;
        }
        ctrl.kpiFirstRow  = kpis.slice(0, 3);
        ctrl.kpiSecondRow = kpis.slice(3, 6);
        ctrl.kpiFullRow = ctrl.kpiFirstRow.concat(ctrl.kpiSecondRow);
    }
}
