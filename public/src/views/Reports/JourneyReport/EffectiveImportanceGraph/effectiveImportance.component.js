app.component("effectiveImportance", {
    bindings: {
        data: '<',
    },
    controller: EffectiveImportanceController,
    template: ['$templateCache', function($templateCache) {
        return $templateCache.get('views/Reports/JourneyReport/EffectiveImportanceGraph/effectiveImportance.template.html')
    }]

});

function EffectiveImportanceController() {
    var ctrl = this;
    ctrl.width = 400;
    ctrl.height = 400;

    ctrl.$onChanges = function(componentProperties) {
        if (ctrl.data) {
            setTimeout(() => {
                ctrl.width = angular.element(".touchpointgraphContainer")[0].offsetWidth;
                ctrl.height = angular.element(".touchpointgraphContainer")[0].offsetHeight;
                createEffectiveImportance(ctrl.data);

            }, 100);
        }
    };
    ctrl.$onInit = function() {
        if (ctrl.data) {
            setTimeout(() => {
                ctrl.width = angular.element(".touchpointgraphContainer")[0].offsetWidth;
                ctrl.height = angular.element(".touchpointgraphContainer")[0].offsetHeight;
                createEffectiveImportance(ctrl.data);

            }, 100);
        }
    };


    function createEffectiveImportance(data) {

        var dataset = flattenData(data);
        var x = d3.scale.ordinal()
            .domain(dataset[0].map(function(d) { return d.x; }))
            .rangeRoundBands([0, ctrl.width], .35);

        var y = d3.scale.linear()
            .domain([0, d3.max(dataset, function(d) { return d3.max(d, function(d) { return d.y0 + d.y; }); })])
            .range([ctrl.height - 50, 50]);

        var colors = ["b33040", "#d25c4d"];

        var svg = d3.select(".effectiveImportanceGraph")
            .attr("width", ctrl.width)
            .attr("height", ctrl.height)
            .append("g");

        // Create groups for each series, rects for each segment 
        var groups = svg.selectAll("g.effimp")
            .data(dataset)
            .enter().append("g")
            .attr("class", function(d, i) {
                if (i == 0) {
                    return "fillEffective";
                }
                return "fillImportance";
            })

        var rect = groups.selectAll("rect")
            .data(function(d) { return d; })
            .enter()
            .append("rect")
            .attr("class", function(d, i) {
                if (d.value.effectiveness > d.value.importance) {
                    return "fillGreen";
                }
            })
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y0 + d.y); })
            .attr("height", function(d) { 
              return y(d.y0) - y(d.y0 + d.y);
           })
            .attr("width", x.rangeBand())
            .on("mouseover", function() { tooltip.style("display", null); })
            .on("mouseout", function() { tooltip.style("display", "none"); })
            .on("mousemove", function(d) {
                var xPosition = d3.mouse(this)[0] - 15;
                var yPosition = d3.mouse(this)[1] - 25;
                tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
                tooltip.selectAll("text").remove();
                tooltip.append("text")
                    .text(function() {
                        return "Importance:" + d.value.rawImportance;
                    }).attr("dy", "0em").attr("class", "efmImpToolTipText");
                tooltip.append("text")
                    .text(function() {
                        return "Effectiveness:" + d.value.rawEffectiveness;
                    }).attr("dy", "1.2em").attr("class", "efmImpToolTipText");
            });

        var kpiTypeLegend = groups.selectAll(".fillImportance rect")
            .data(function(d) {
                return d;
            })
            .enter()
            .append("text")
            .text(function(d) { return d.value.type; })
            .attr("class", "effImpLegendText")
            .attr("text-anchor", "middle")
            .attr('dy', '2.5em')
            .attr('transform', 'translate(35,10)')
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y0); });


        var correlationLegend = groups.selectAll(".fillImportance rect")
            .data(function(d) {
                return d;
            })
            .enter()
            .append("text")
            .text(function(d) { return d.value.avgCorrelation; })
            .attr("class", "effImpLegendText")
            .attr("text-anchor", "middle")
            .attr('dy', '0.65em')
            .attr('transform', 'translate(35,10)')
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y0); });

        var sampleSizeLegend = groups.selectAll(".fillEffective rect")
            .data(function(d) {
                return d;
            })
            .enter()
            .append("text")
            .text(function(d) {
                if (d && d.value && d.value.sampleSize) {
                    return "n=" + d.value.sampleSize;
                }
                return '';
            })
            .attr("class", "effImpLegendText")
            .attr("text-anchor", "middle")
            .attr('dy', '0.65em')
            .attr('transform', 'translate(35, -15)')
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y0 + d.y); });
            
          var finaleffect = groups.selectAll(".fillEffective rect")
            .data(function(d) {
                return d;
            })
            .enter()
            .append("text")
            .text(function(d) {
                //console.log(d);
                return d.value.rawEffectiveness - d.value.rawImportance;
            })
            .attr("class", "effImpLegendText")
            .attr("text-anchor", "middle")
            .attr('dy', '0.65em')
            .attr('transform', 'translate(35, -15)')
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) {
                if(d.y > d.y0){
                  if(d.y - d.y0 > 20){
                    return y(d.y - 20);  
                  }
                  else if(d.y - d.y0 > 10){
                    return y(d.y - 10);
                  }
                  else{
                    return y(d.y - 2);
                  }
                }else{
                  return y(d.y0 - 5 + (d.y0 - d.y)/2);
                }
            });


        // ToolTip
        var tooltip = svg.append("g")
            .attr("class", "effImpTooltip")
            .style("display", "none");

        tooltip.append("rect")
            .attr("width", 80)
            .attr("height", 30)
            .attr('transform', 'translate(-5,-12)');

        tooltip.append("text")
            .attr("x", 15)
            .attr("dy", "1.2em")
            .style("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold");

    }

    function flattenData(data) {
        var i = 0;
        var dataSet = [];
        for (i = 0; i < data.length * 2; i = i + 2) {
            dataSet.push({
                x: i,
                importance: Math.abs(data[i / 2].wantsAndNeeds.importance),
                rawImportance: data[i / 2].wantsAndNeeds.importance,
                effectiveness: Math.abs(data[i / 2].wantsAndNeeds.effectiveness),
                rawEffectiveness: data[i / 2].wantsAndNeeds.effectiveness,
                avgCorrelation: data[i / 2].wantsAndNeeds.avgCorrelation,
                sampleSize: data[i / 2].wantsAndNeeds.sampleSize,
                type: "Wants And Needs",
            });
            dataSet.push({
                x: i + 1,
                importance: Math.abs(data[i / 2].touchPoints.importance),
                rawImportance: data[i / 2].touchPoints.importance,
                effectiveness: Math.abs(data[i / 2].touchPoints.effectiveness),
                rawEffectiveness: data[i / 2].touchPoints.effectiveness,
                avgCorrelation: data[i / 2].touchPoints.avgCorrelation,
                sampleSize: data[i / 2].touchPoints.sampleSize,
                type: "TouchPoints",
            });
        }
        var data = d3.layout.stack()(["effectiveness", "importance"].map(function(param) {
            return dataSet.map(function(d) {
                return { x: d.x, y: +d[param], value: d };
            });
        }));
        return data;
    }

}