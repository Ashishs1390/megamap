app.component("journeyOverview", {
    bindings: {
        stages: '<',
        score: '<'
    },
    controller: JourneyOverviewController,
    template: ['$templateCache', function($templateCache) {
        return $templateCache.get('views/Reports/JourneyReport/Overview/overview.template.html')
    }]
});

function JourneyOverviewController($rootScope, orderByFilter) {
    var ctrl = this;


    ctrl.radius = 0;
    ctrl.width = 0;
    ctrl.height = 0;
    ctrl.svg = null;


    ctrl.$onInit = function() {
        if (ctrl.stages && ctrl.stages.length > 0) {
            drawOverviewArc(ctrl.stages);
        }
    }

    ctrl.$onChanges = function(componentProperties) {
        if (ctrl.stages && ctrl.stages.length > 0) {
            drawOverviewArc(ctrl.stages);
        }
    };



    var toRadians = function(deg) {
        return deg * (Math.PI / 180);
    };


    function drawOverviewArc(phases) {
        if (!phases || phases.length < 0) {
            return;
        }

        var stages = JSON.parse(JSON.stringify(orderByFilter(phases, ['-order'])));
        ctrl.width = 760;
        ctrl.height = 360;
        ctrl.radius = Math.min(ctrl.width, ctrl.height) / 2;



        ctrl.svg = d3.select("svg.overviewsvg");

        ctrl.svg.attr("width", ctrl.width)
            .attr("height", ctrl.height);

        ctrl.svg = d3.select("svg.overviewsvg");

        var arc = d3.svg.arc()
            .outerRadius(ctrl.radius - 10)
            .innerRadius(ctrl.radius - 50)
            .padAngle(.03);

        var angleSegment = 315 / stages.length;
        var arcData = [{}, {}];

        for (var i = 0; i < stages.length; i++) {
            var startAngle = -225 + (i * angleSegment);
            var endAngle = startAngle + angleSegment;
            if($rootScope.edgeBrowser){
              endAngle = endAngle -2;
            }
            arcData.push({
                label: stages[i].title,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle)
            });
        }
        // console.log('is this edge?', $rootScope.edgeBrowser)


        //Draw Arc
        ctrl.svg
            .selectAll('path')
            .data(arcData)
            .enter()
            .append('path')
            .attr("transform", "translate(" + ctrl.width / 2 + "," + ctrl.height / 2 + ")")
            // .attr("marker-start", function(d, i) {
            //     if($rootScope.edgeBrowser){
            //       return "";
            //     } else {
            //       if (i == 2) {
            //           return "url(#chevron)";
            //       }
            //       return "url(#chevronmid)";
            //     }
            // })
            .attr('d', arc)
            .attr('class', 'phasearc');



        //Draw Labels
        ctrl.svg.selectAll('.phaseName')
            .data(arcData)
            .enter()
            .append('text')
            .each(function(d) {
                var centroid = arc.centroid(d);
                d3.select(this)
                    .attr('x', function() { if (!isNaN(centroid[0])) { return centroid[0]; } })
                    .attr('y', function() { if (!isNaN(centroid[1])) { return centroid[1]; } })
                    .attr('dy', '0.65em')
                    .attr('class', function(){
                      if($rootScope.edgeBrowser){
                        return 'phaseNameEdge';
                      } else {
                        return 'phaseName'
                      }
                    })
                    .text(d.label)
                    .attr("text-anchor", "middle")
                    .attr("transform",
                        function(data) {
                            if (!isNaN(centroid[0])) {

                                var translateX = ctrl.width / 2;
                                var translateY = (ctrl.height / 2) - 20;

                                if (centroid[0] < 0) {
                                    translateX = translateX - 100;
                                } else {
                                    translateX = translateX + 100;
                                }
                                return ("translate(" + translateX + "," + translateY + ")");
                            }
                        })
                    .transition()
                    .duration(1500)
                    .attrTween("d", function(d) {
                        var i = d3.interpolate(d.endAngle, d.startAngle);
                        return function(t) {
                            d.startAngle = i(t);
                            return arc(d);
                        }
                    });
            });




        //Draw outercircle pointer in arc
        ctrl.svg.selectAll('.outertickcircle')
            .data(arcData)
            .enter()
            .append("circle")
            .each(function(d) {
                var centroid = arc.centroid(d);
                d3.select(this)

                .attr('r', 4)
                    .attr('class', 'outertickcircle')
                    .attr('cx', function(d) {
                        if (!isNaN(centroid[0])) {
                            return arc.centroid(d)[0];
                        }
                    })
                    .attr('cy', function(d) {
                        if (!isNaN(centroid[1])) {
                            return arc.centroid(d)[1];
                        }
                    })
                    .attr("transform", "translate(" + ctrl.width / 2 + "," + ctrl.height / 2 + ")")
                    .style("display", function(d) {
                        if (!d.label) {
                            return "none";
                        }
                        return "block";
                    });

            });


        //Draw inner circle pointer in arc
        ctrl.svg.selectAll('.innertickcircle')
            .data(arcData)
            .enter()
            .append("circle")
            .each(function(d) {
                var centroid = arc.centroid(d);
                d3.select(this)

                .attr('r', 1.5)
                    .attr('class', 'innertickcircle')
                    .attr('cx', function(d) {
                        if (!isNaN(centroid[0])) {
                            return arc.centroid(d)[0];
                        }
                    })
                    .attr('cy', function(d) {
                        if (!isNaN(centroid[1])) {
                            return arc.centroid(d)[1];
                        }
                    })
                    .attr("transform", "translate(" + ctrl.width / 2 + "," + ctrl.height / 2 + ")")
                    .style("display", function(d) {
                        if (!d.label) {
                            return "none";
                        }
                        return "block";
                    });

            });




        //Draw lines on arc
        ctrl.svg.selectAll('.lines')
            .data(arcData)
            .enter()
            .append("line")
            .each(function(d) {
                var centroid = arc.centroid(d);
                if (isNaN(centroid[0]) || isNaN(centroid[0])) {
                    return;
                }
                var x1 = centroid[0];
                var x2 = centroid[0] < 0 ? (centroid[0] - 120) : (centroid[0] + 125);
                var y1 = centroid[1];
                var y2 = centroid[1];
                d3.select(this)
                    .attr("transform", "translate(" + ctrl.width / 2 + "," + ctrl.height / 2 + ")")
                    .attr("class", "arclines")
                    .attr("x1", x1)
                    .attr("y1", y1)
                    .attr("x2", x1)
                    .attr("y2", y1)
                    .transition()
                    .duration(1000)
                    .attr("x1", x1)
                    .attr("y1", y1)
                    .attr("x2", x2)
                    .attr("y2", y2)

            });


    }
}
