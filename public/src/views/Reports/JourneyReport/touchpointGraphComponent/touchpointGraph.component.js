app.directive("touchpointGraph", function($compile) {
    return {
      scope: {
        touchpoints: '<',
        stages: '<',
        journey: '<'
      },
      controller: TouchpointGraphController,
      templateUrl: 'views/Reports/JourneyReport/touchpointGraphComponent/touchpointGraph.template.html'
    }
});

function TouchpointGraphController($http, $scope, $timeout, $filter, $compile, $uibModal, $state) {
    var ctrl = $scope;

    ctrl.width = 400;
    ctrl.height = 400;
    ctrl.marginTop = ctrl.height / 4;
    ctrl.mot = []

    $http.get(`/api/mot/${$state.params.uuid}`)
    .then(({ data }) => {

      ctrl.mot = data

      ctrl.width = angular.element(".touchpointgraphContainer")[0].offsetWidth;
      ctrl.height = angular.element(".touchpointgraphContainer")[0].offsetHeight;

      ctrl.marginTop = 115;

      if(ctrl.mot) createGraph();
    })
    .catch(error => {
      console.log('THIS IS THE ERROR')
      console.error(error)
    })


    function createGraph() {
        var datapoints = [];
        var touchPointCounter = 1;
        var blankData = { score: 0 }

        console.log(ctrl.stages)

        $filter('orderBy')(ctrl.stages, 'order').forEach(function(stage) {

          if(ctrl.mot[stage.uuid]) ctrl.mot[stage.uuid].forEach((mot, i) => {
            var data = {};
            data.pointerCount = touchPointCounter;

            data.value = {
              score: mot.score,
              trend: (parseInt(mot.trend) || ''),
              image: `/build/images/emojis/${Math.round(mot.score)}face.png`,
              description: (mot.description || ''),
              persona: (mot.persona || {}),
              uuid: mot.uuid,
              note: mot.note
            }

            datapoints.push(data);
            touchPointCounter += 1
          })
        })

        //Create Scales
        var xScale = d3.scale.linear().domain([0, touchPointCounter]).range([0, ctrl.width]);
        var yScale = d3.scale.linear().domain([0, 10]).range([100, 0]);

        //Path generator schema
        var lineGenerator = d3.svg.line()
            .interpolate("cardinal")
            .x(function(d) {
                if (d) {
                    return xScale(d.pointerCount);
                }
            })
            .y(function(d) {
                if (d) {
                    return yScale(d.value.score);
                }
            });


        //Create line Graph
        var svg = d3.selectAll(".touchpointgraph");
        svg.attr("width", ctrl.width);
        svg.attr("height", ctrl.height);

        var path = svg.append("path")
            .attr("class", "touchpointLine")
            .attr({ transform: "translate(" + 0 + "," + ctrl.marginTop + ")" })
            .attr("d", lineGenerator(datapoints));

        var totalLength = path.node().getTotalLength();
        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1500)
            .ease("linear")
            .attr("stroke-dashoffset", 0);


        createTicks(svg, datapoints, xScale, yScale);
        createAxis(svg, datapoints, xScale, yScale);
       // createSlicer(svg, datapoints, xScale, yScale);
        createScoreText(svg, datapoints, xScale, yScale);

        function labelPosition(score) {
          if (score > 5) {
            return (yScale(score) - 50);
          }
          return (yScale(score) + 50);
        }

        function getTrend(trendId) {
          switch(trendId) {
            case 0:
              return '&DoubleDownArrow;';
            case 1:
              return '&DoubleLeftRightArrow;';
            case 2:
              return '&DoubleUpArrow;';
            default: return '';
          }
        }

        function createScoreText(svg, datapoints) {
            var svgScore = svg.selectAll(".kpiscore")
                        .data(datapoints)
                        .enter()

            svgScore.append('text')
                .attr("class", "kpiscore")
                .attr("x", lineGenerator.x())
                .attr("y", function(d) {
                    if (d.value.score > 5) {
                        return (yScale(d.value.score) - 1);
                    }
                    return (yScale(d.value.score) - 15);
                })
                .attr({ transform: "translate(" + -10 + "," + ctrl.marginTop + ")" })
                .html(function(d) {
                  return (d.value.score > 0 ? (d.value.score + getTrend(d.value.trend)): '');
                })


            svgScore.append('text')
                .attr("class", "kpiscore-tooltip")
                .attr("x", lineGenerator.x())
                .attr("y", function(d) {
                    if (d.value.score > 5) {
                        return (yScale(d.value.score) - 95);
                    }
                    return (yScale(d.value.score) + 98);
                })
                .attr({ transform: "translate(" + -10 + "," + ctrl.marginTop + ")" })
                .attr("id", function(d) {
                  return 'note_' + d.value.uuid;
                })
                .text(function(d) {
                  return (d.value.score > 0 ? d.value.description + ' ['+(d.value.persona ? d.value.persona.title : "")+'] ' : '');
                })

            //Create Score Line
            svg.selectAll(".kpiscoreline")
                .data(datapoints)
                .enter()
                .append('line')
                .each(function(d) {
                    var originX = lineGenerator.x();
                    var originY = lineGenerator.y();
                    var endY;
                    if (d.value.score > 5) {
                        endY = yScale(d.value.score) - 65;
                    } else {
                        endY = yScale(d.value.score) + 50;
                    }
                    if(d.value.score > 0) {
                      d3.select(this)
                        .attr("class", "kpiscoreline")
                        .attr("x1", originX)
                        .attr("y1", originY)
                        .attr("x2", originX)
                        .attr("y2", endY)
                        .attr({ transform: "translate(0," + ctrl.marginTop + ")" });
                    }
                });


            //create Score Icon
            svg.selectAll(".kpiIcon")
                .data(datapoints)
                .enter()
                .append("svg:image")
                .each(function(d) {
                    var x = lineGenerator.x();
                    var y;
                    if (d.value.score > 5) {
                        y = yScale(d.value.score) - 85;
                    } else {
                        y = yScale(d.value.score) + 50;
                    }
                    if(d.value.score > 0) {
                      d3.select(this)
                          .attr("class", "kpiIcon")
                          .attr("x", x)
                          .attr("y", y)
                          .attr("xlink:href", d.value.image)
                          .attr("width", "30")
                          .attr("height", "30")
                          // .attr("uib-popover", "test")
                          // .on("click", function(){
                          //   window.open('https://google.com', "MOT", "modal=yes,dialog=no,titlebar=no,menubar=no,location=no,resizable=no,scrollbars=no,status=no,width=200,height=200")
                        	// 	// alert('click')
                        	// })
                          .on("mouseover", function(){
                            return d3.select('#note_' + d.value.uuid).style("visibility", "visible");
                          })
                          .on("mouseout", function(){
                            return d3.select('#note_' + d.value.uuid).style("visibility", "hidden");
                          })
                          .on("click", function(){
                            $scope.currentStage = d.value.note.rels.stage;

                            var modalInstance = $uibModal.open({
                              templateUrl: 'views/Workshops/Journey/edit_note.html',
                              controller: JourneyNoteEditorCtrl,
                              size: 'lg',
                              backdrop: 'static',
                              keyboard: false,
                              resolve: {
                                eventScope: function () {
                                  return $scope;
                                },
                                uuid: function () {
                                  return null;
                                },
                                note: function () {
                                  return d.value.note;
                                }
                              }
                            });

                            modalInstance.result.then(data => {
                              $state.reload()
                            }, () => {});

                          })
                          .attr({ transform: "translate(-15," + ctrl.marginTop + ")" })
                    }

                    $compile(this)($scope);
                });

            //create Score IconText
            svg.selectAll(".kpiIconText")
                .data(datapoints)
                .enter()
                .append("text")
                .each(function(d) {
                    var x = lineGenerator.x();
                    var y;
                    if (d.value.score > 5) {
                        y = yScale(d.value.score) - 55;
                    } else {
                        y = yScale(d.value.score) + 80;
                    }
                    d3.select(this)
                        .attr("class", "kpiIconText")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dx", "1.15em")
                        .text(function(d) {
                            return d.value.kpi;
                        })
                        .attr("text-anchor", "middle")
                        .attr({ transform: "translate(-10," + ctrl.marginTop + ")" });
                });
        }

        function createTicks(svg, datapoints, xScale, yScale) {
            //Create circle
            svg.selectAll(".touchpointOuterCircle")
                .data(datapoints)
                .enter().append("circle")
                .attr("class", "touchpointOuterCircle")
                .attr("cx", lineGenerator.x())
                .attr("cy", lineGenerator.y())
                .attr({ transform: "translate(" + 0 + "," + ctrl.marginTop + ")" })
                .attr("r", function(d) {
                  if (d.value.score > 0) {
                    return 4;
                  }
                })

            svg.selectAll(".touchpointInnerCircle")
                .data(datapoints)
                .enter().append("circle")
                .attr("class", "touchpointInnerCircle")
                .attr("cx", lineGenerator.x())
                .attr({ transform: "translate(" + 0 + "," + ctrl.marginTop + ")" })
                .attr("cy", lineGenerator.y())
                .attr("r", function(d) {
                  if (d.value.score > 0) {
                    return 2;
                  }
                })

        }

        function createAxis(svg, datapoints, xScale, yScale) {

            //Create Horizontal Lines
            svg.append("line")
                .attr("class", "topaxis")
                .attr("x1", "-15")
                .attr("y1", yScale(105))
                .attr("x2", xScale(touchPointCounter))
                .attr("y2", yScale(105))
                .attr({ transform: "translate(" + 20 + "," + ctrl.marginTop + ")" });

            svg.append("line")
                .attr("class", "bottomaxis")
                .attr("x1", "0")
                .attr("y1", yScale(0))
                .attr("x2", xScale(touchPointCounter))
                .attr("y2", yScale(0))
                .attr({ transform: "translate(0," + ctrl.marginTop + ")" });



        }

        function createSlicer(svg, datapoints, xScale, yScale) {
            //Create Vertical Slicers
            var xSlicerCounter = 0;
            for (var i = 1; i < ctrl.touchpoints.length + 1; i++) {
                xSlicerCounter += 4;
                svg.append("line")
                    .attr("class", "slicer")
                    .attr("x1", function(d) {
                        return xScale(xSlicerCounter)
                    })
                    .attr("y1", yScale(-125))
                    .attr("x2", xScale(xSlicerCounter))
                    .attr("y2", yScale(225))
                    .attr({ transform: "translate(0," + ctrl.marginTop + ")" });
            }
        }
    }
}
