app.component("journeyScore", {
    bindings: {
        score: '<',
        controlId: '@'
    },
    controller: JourneyScoreController,
    template: ['$templateCache', function($templateCache) {
        return $templateCache.get('views/Reports/JourneyReport/scoreComponent/score.template.html')
    }]

});

function JourneyScoreController() {
    var ctrl = this;

    // ctrl.$onChanges = function(componentProperties) {
    //     if (ctrl.score) {
    //         setTimeout(createKpiScore.bind(null, ctrl.score), 100);
    //     }
    // };
    ctrl.$onInit = function() {
        if (ctrl.score) {
            setTimeout(createKpiScore.bind(null, ctrl.score), 100);
        }
    };

    function colors(score) {
      if(score < 6) return 'red';
      if(score > 5 && score < 9) return 'yellow';
      if(score > 8) return 'green'
    }

    function createKpiScore(score) {
        var dataset = [];
        // var color = 'red'
        //Creating Default pie with 10 partitions
        for (var i = 0; i < 10; i++) {
            if (i + 1 <= score) {
                dataset.push({ fill: true, percent: 10, color: colors(score) });
            } else {
                dataset.push({ fill: false, percent: 10 });
            }
        }

        var pie = d3.layout.pie()
            .value(function(d) { return d.percent })
            .sort(null)
            .padAngle(.03);

        var w = 100,
            h = 100;

        var outerRadius = w / 2;
        var innerRadius = outerRadius - 10;


        var arc = d3.svg.arc()
            .outerRadius(outerRadius)
            .innerRadius(innerRadius);


        var svg = d3.select("#" + ctrl.controlId)
            .append("svg")
            .attr({
                width: w,
                height: h,
                class: 'shadow'
            })
            .append('g')
            .attr({
                transform: 'translate(' + w / 2 + ',' + h / 2 + ')'
            });
        var path = svg.selectAll('path')
            .data(pie(dataset))
            .enter()
            .append('path')

        .attr({
                d: arc,
                class: function(d) {
                    if (!d.data.fill) {
                        return "kpiClear";
                    }
                    return "kpiFill " + d.data.color;
                }
            }).transition()
            .duration(function(d, i) {
                return i * 400;
            })
            .attrTween("d", function(d) {
                if (d.data.fill) {
                    var i = d3.interpolate(d.startAngle, d.endAngle);
                    return function(t) {
                        d.endAngle = i(t);
                        return arc(d);
                    }
                }
            });



        //Append Score Text
        svg.append('text')
            .attr("class", "kpiscore")
            .attr({
                x: (score.length > 1 ? -30 : -20),
                y: 8
            })
            .text(score + "/10");
    }
}
