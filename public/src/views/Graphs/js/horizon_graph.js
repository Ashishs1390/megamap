app.controller('HorizonGraphCtrl', function(journey, $scope, $rootScope, $stateParams, $http, $q, $filter, $timeout, $window , $state) {
  var canvas = document.getElementById("graph").getContext("2d");
  var graph;
  $scope.journey = journey;
  $scope.growth_sizes = {
    0: 10,
    1: 22,
    2: 34,
    3: 46
  }
  $scope.colors = {
    run: 'rgba(255,165,0, 0.7)',
    grow: 'rgba(0, 0, 255, 0.7)',
    transform: 'rgba(0, 128, 0, 0.7)',
    h1: 'rgba(255,165, 0, 0.7)',
    h2: 'rgba(0, 0, 255, 0.7)',
    h3: 'rgba(0, 128, 0, 0.7)'
  }
  $scope.hoverColors = {
    run: 'rgba(255,165,0, 1)',
    grow: 'rgba(0, 0, 255, 1)',
    transform: 'rgba(0, 128, 0, 1)',
    h1: 'rgba(255,165, 0, 1)',
    h2: 'rgba(0, 0, 255, 1)',
    h3: 'rgba(0, 128, 0, 1)'
  }

  $scope.journey.interactions = $filter('orderBy')($scope.journey.interactions, 'order');
  $scope.journey.stages = $filter('orderBy')($scope.journey.stages, 'order');
  $scope.allStages = {
    title: 'All Initiatives',
    notes: []
  }
  $scope.allPersonas = {
    title: 'All Personas',
    uuid: 'all'
  }
  $scope.allKpis = 'All Kpis';

  $scope.allInteractions = {
    title: 'All Interactions',
    uuid: 'all'
  }
  $scope.axisProperties = [
    {
      label: 'Competitive Differentiation',
      property: 'competitive_differentiation'
    },
    {
      label: 'Economic Value Add',
      property: 'economic_value'
    },
    {
      label: 'Timing: Shorter or Longer Term',
      property: 'timing_term'
    },
    {
      label: 'Timing: Shorter or Longer Duration',
      property: 'timing_duration'
    },
    {
      label: 'Urgency: Threat Response',
      property: 'threat_response'
    },
    {
      label: 'Urgency: Strategic Positioning',
      property: 'strategic_positioning'
    },
    {
      label: 'Urgency: Bottleneck Dependency',
      property: 'bottleneck_dependency'
    },
    {
      label: 'Financial: Risk',
      property: 'risk'
    },
    {
      label: 'Financial: Risk Return / Economic Value Add',
      property: 'value_add'
    },
    {
      label: 'Financial: Risk / Level of Investment',
      property: 'investment_level'
    },
    {
      label: 'Level of Effort / Resource Constraints',
      property: 'resource_constraints'
    },
    {
      label: 'Level of Effort / Complexity',
      property: 'complexity'
    },
    {
      label: 'Tech Considerations: Competitive Advantage',
      property: 'competitive_advantage'
    },
    {
      label: 'Techn Considerations: Technology Maturity',
      property: 'technology_maturity'
    }
  ]

  $scope.average_grids = true;
  $scope.graphData = {
    stage: $scope.allStages,
    persona: $scope.allPersonas,
    kpi: $scope.allKpis,
    interaction: $scope.allInteractions,
    x: $scope.axisProperties[0],
    y_plus: $scope.axisProperties[1],
    y_minus: null,
    dataset1: [],
    dataset2: [],
    dataset3: [],
    dataset4: []
  }

  $scope.setLabels = function() {
    $scope.labels = [];
    [].forEach.call(['x', 'y_plus', 'y_minus'], function(key) {
      if($scope.graphData[key]) {
        $scope.labels.push($scope.graphData[key].label)
      }
    })
  }

  $scope.plotGraph = function(){
    if(graph) graph.destroy();

    var datasets = [{
      borderColor: 'white',
      backgroundColor: 'transparent',
      pointHoverBackgroundColor: $scope.graphData.dataset1.map(d => {
        if(d.horizon_level) {
          return $scope.hoverColors[d.horizon_level]
        }
        else {
          return ($scope.hoverColors[d.stage.split(' ')[0].toLowerCase()] || 'black')
        }
      }),
      pointBackgroundColor: $scope.graphData.dataset1.map(d => {
        if(d.horizon_level) {
          return $scope.colors[d.horizon_level]
        }
        else {
          return ($scope.colors[d.stage.split(' ')[0].toLowerCase()] || 'black')
        }
      }),
      pointRadius: $scope.graphData.dataset1.map(d => {
        return $scope.growth_sizes[d.growth]
      }),
      pointHoverRadius: $scope.graphData.dataset1.map(d => {
        return $scope.growth_sizes[d.growth]
      }),
      data: $scope.graphData.dataset1
    },{
      borderColor: 'white',
      backgroundColor: 'transparent',
      pointBackgroundColor: $scope.graphData.dataset2.map(d => {
        return ($scope.colors[d.stage.split(' ')[0].toLowerCase()] || 'black')
      }),
      pointHoverBackgroundColor: $scope.graphData.dataset2.map(d => {
        return ($scope.hoverColors[d.stage.split(' ')[0].toLowerCase()] || 'black')
      }),
      pointRadius: $scope.graphData.dataset2.map(d => {
        return $scope.growth_sizes[d.growth]
      }),
      pointHoverRadius: $scope.graphData.dataset2.map(d => {
        return $scope.growth_sizes[d.growth]
      }),
      data: $scope.graphData.dataset2
    }]
    if($scope.average_grids) {
      datasets.push({
        borderColor: 'white',
        backgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBackgroundColor: 'transparent',
        pointRadius: $scope.graphData.dataset3.map(d => {
          return $scope.growth_sizes[d.growth]
        }),
        pointHoverRadius: $scope.graphData.dataset3.map(d => {
          return $scope.growth_sizes[d.growth]
        }),
        data: $scope.graphData.dataset3
      },{
        borderColor: 'white',
        backgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBackgroundColor: 'transparent',
        pointRadius: $scope.graphData.dataset4.map(d => {
          return $scope.growth_sizes[d.growth]
        }),
        pointHoverRadius: $scope.graphData.dataset4.map(d => {
          return $scope.growth_sizes[d.growth]
        }),
        data: $scope.graphData.dataset4
      })
    }

    graph = new $window.Chart.Scatter(canvas, {
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        hoverMode: 'nearest',
        onClick: function(evt) {
          var activePoints = graph.getElementsAtEvent(evt);
          if (activePoints[0]) {
            // var chartData = activePoints[0]['_chart'].config.data;
            var idx = activePoints[0]['_index'];

            // var label = chartData.labels[idx];
            var isStageFound = false;
            var currNote = $scope.graphData.stage.notes[idx];

            var currNoteStage;
            $scope.notes = [];
            for(var i =0 ; i< $scope.journey.stages.length; i++) {
              $scope.notes = $scope.notes.concat($scope.journey.stages[i].notes.filter(function(note){
                return ($scope.currNotesOnGraph.filter(currNote => (currNote && currNote.uuid === note.uuid)).length >0)
              }));
            }
            var currNote = $scope.notes[idx];

            for(var i =0 ; i< $scope.journey.stages.length; i++) {
              currNoteStage = $scope.journey.stages[i];
              for(var j = 0  ; j < currNoteStage.notes.length ; j++){

                if(currNoteStage.notes[j].uuid == currNote.uuid){
                  isStageFound = true;
                  break;
                }
              }
              if(isStageFound){
                break;
              }
            }
            $rootScope.currNote = currNote.description;
            $state.go('workshop.journey', {'id':$scope.journey.uuid, 'tab':currNoteStage.uuid});
          }
       },
      //events : ['click'],
        title: {
          display: false,
          text: 'Horizon Graph'
        },
        legend: {
          display: false
        },
        tooltips: {
          displayColors: false,
          callbacks: {
            title: (tooltipItem, data) => {
              var text = data.datasets[0].data[tooltipItem[0].index].text;

              if(text && text.length > 30) {
                text = text.match(/.{30}\w*\W*|.*/g);
                text.unshift('');
                text.push('');
              } else {
                text = ['', text, ''];
              }
              return text;
		        },
            label: () => { return }
          }
        },
        scales: {
          xAxes: [{
            type: 'linear',
            name: 'x',
            position: 'bottom',
            gridLines: {
              zeroLineColor: "rgba(0,255,0,1)",
              borderDashOffset: 3
            },
            scaleLabel: {
              display: true,
              labelString: $scope.graphData.x.label
            },
            ticks: {
              min: 0,
              max: 10,
              callback: function(value) {
                return '' //value.toFixed(1).replace('-', '');
              }
            },
          }],
          yAxes: [{
            ticks: {
              min: 0,
              max: 10,
              callback: function(value) {
                return '' //value.toFixed(1).replace('-', '');
              }
            },
            name: 'y',
            position: 'left',
            gridLines: {
              zeroLineColor: "rgba(0,255,0,1)"
            },
            scaleLabel: {
              display: true,
              labelString: $scope.graphData.y_plus.label
            }
          }]
        }
      }
    });
  }

  $scope.calculateDataPoints = function(search = false) {
    $scope.currNotesOnGraph = [];
    if(!$scope.graphData.y_plus && !$scope.graphData.y_minus) return;

    $scope.graphData.dataset1 = [];
    $scope.graphData.dataset2 = [];
    $scope.graphData.dataset3 = [];
    $scope.graphData.dataset4 = [];

    $scope.setLabels();

    var high_x, low_x, high_y, low_y, x_average, y_average;

    var averages = {
      x: [],
      y: []
    }

    let stageNotes;

    if(search) {
      stageNotes = $filter('filter')($scope.graphData.stage.notes, search)
    }
    else { stageNotes = $scope.graphData.stage.notes }

    stageNotes.map(function(note){
      if(note){
      $scope.average_grids = false;

      // GET PRIMARY KPI
        note.primary_kpi_label = '';

        note.rels.kpis.map(function(kpi) {
          if(kpi.uuid === note.primary_kpi) {
            note.primary_kpi_label = (kpi.rel.label || kpi.title);
            return;
          }
        })

      var match_persona     = $scope.graphData.persona.uuid     === 'all' || $scope.graphData.persona.uuid     === note.rels.persona.uuid;
      var match_interaction = $scope.graphData.interaction.uuid === 'all' || $scope.graphData.interaction.uuid === note.rels.interaction.uuid;
      var match_kpi         = $scope.graphData.kpi              === 'All Kpis' || $scope.graphData.kpi              === note.primary_kpi_label;

      if(match_persona && match_interaction && match_kpi) {

        var points = {
          x: 0,
          y_plus: 0,
          y_minus: 0
        }

        Object.keys(points).forEach(function(key) {
          var corrs
          if($scope.graphData[key] && $scope.graphData[key].property.indexOf('index') > -1) {
            if(typeof($scope.journey[$scope.graphData[key].property]) === 'string') {
              corrs = JSON.parse($scope.journey[$scope.graphData[key].property]);
            } else {
              corrs = $scope.journey[$scope.graphData[key].property];
            }
            corrs.forEach(function(obj) {
              if(note[obj.property]) {
                points[key] += (note[obj.property] || 0);
              }
            })
            points[key] = points[key] / corrs.length;

          }
          else if($scope.graphData[key] && note[$scope.graphData[key].property]) {
            if(typeof note[$scope.graphData[key].property] === 'number') {
              points[key] = note[$scope.graphData[key].property] || 0;
            }
            else if(typeof(note[$scope.graphData[key].property]) === 'object'){
              points[key] = note[$scope.graphData[key].property].value || 0;
            }
          }

          if(points[key]) {
            $scope.currNotesOnGraph.push(note);
          }

          if(key === 'y_minus') {
            points[key] = points[key] * -1;
          }
        })
        // push data points
        if(points.y_plus > 0 && points.x > 0) {
          averages.x.push(points.x);
          averages.y.push(points.y_plus);

          if(note.h1 || note.h2 || note.h3) {
            ['h1', 'h2', 'h3'].forEach(horizon_level => {
              if(note[horizon_level]) {
                $scope.graphData.dataset1.push({
                  x: points.x.toFixed(2),
                  y: points.y_plus.toFixed(2),
                  horizon_level: horizon_level,
                  growth: note.profit_margin_growth || 0,
                  stage: note.rels.stage.title,
                  text: (note.description || '')
                })
              }
            })
          }
          else {
            $scope.graphData.dataset1.push({
              x: points.x.toFixed(2),
              y: points.y_plus.toFixed(2),
              growth: note.profit_margin_growth || 0,
              stage: note.rels.stage.title,
              text: (note.description || '')
            })
          }

          if(!high_x) {
            high_x = points.x;
          } else {
            if(points.x > high_x) high_x = points.x;
          }
          if(!low_x) {
            low_x = points.x;
          } else {
            if(points.x < low_x) low_x  = points.x;
          }
          if(!high_y) {
            high_y = points.y_plus;
          } else {
            if(points.y_plus > high_y) high_y = points.y_plus;
          }
          if(!low_y) {
            low_y = points.y_plus;
          } else {
            if(points.y_plus < low_y) low_y = points.y_plus;
          }
        }
        if(points.y_minus < 0 && points.x > 0) {
          $scope.average_grids = false;
          averages.x.push(points.x)
          averages.y.push(points.y_minus)

          if($scope.graphData.dataset2 && $scope.graphData.dataset2colors) {

            if(note.h1 || note.h2 || note.h3) {
              ['h1', 'h2', 'h3'].forEach(horizon_level => {
                if(note[horizon_level]) {
                  $scope.graphData.dataset2.push({
                    x: points.x.toFixed(2),
                    y: points.y_minus.toFixed(2),
                    text: (note.description || ''),
                    horizon_level: horizon_level
                  })
                  $scope.graphData.dataset2colors.push($scope.colors[note[horizon_level]]);
                }
              })
            }
            else {
              $scope.graphData.dataset2.push({
                x: points.x.toFixed(2),
                y: points.y_minus.toFixed(2),
                text: (note.description || '')
              })
              $scope.graphData.dataset2colors.push(
                $scope.colors[note.stage.split(' ')[0].toLowerCase()] || 'black'
              );
            }
          }

          if(!high_x) {
            high_x = points.x;
          } else {
            if(points.x > high_x) high_x = points.x;
          }
          if(!low_x) {
            low_x = points.x
          } else {
            if(points.x < low_x) low_x  = points.x;
          }
          if(!low_y) {
            low_y = points.y_minus;
          } else {
            if(points.y_minus < low_y) low_y = points.y_minus;
          }
        }
      }
      return;
    }
    })

    if($scope.average_grids) {
      if(averages.x.length > 0) {
        x_average = (averages.x.reduce(function(a, b) { return a + b; }) / averages.x.length).toFixed(2);
      }
      if(averages.y.length > 0) {
        y_average = (averages.y.reduce(function(a, b) { return a + b; }) / averages.y.length).toFixed(2);
      }

      if(true) {
        $scope.graphData.dataset3 = [{x: low_x, y: y_average}, {x: high_x, y: y_average}];
        $scope.graphData.dataset4 = [{x: x_average, y: low_y}, {x: x_average, y: high_y}];
      }
      firstLoop = false;
    }

    $scope.plotGraph();
  }

  $scope.getData = function() {
    return $q(function(resolve) {
      $scope.journey.stages.map(function(stage){
        $http({
          method: 'GET',
          url: '/api/journey/'+$stateParams.id+'/stage/'+stage.uuid,
          params: {
            'interaction_orders': $scope.journey.interaction_orders,
            'nocache': new Date().getTime()
          }
        }).then(function(resp){
          stage.notes = resp.data;
          $scope.allStages.notes = $scope.allStages.notes.concat(resp.data);
          return stage;
        });
        resolve();
      });
    })
  }

  $scope.getData().then(function() {
    $timeout(function(){
      $scope.graphData.stage.notes = [];
      for(var i =0 ; i< $scope.journey.stages.length; i++) {
        $scope.graphData.stage.notes = $scope.graphData.stage.notes.concat($scope.journey.stages[i].notes)
      }

      $scope.calculateDataPoints()
    }, 1500)
  })

    $scope.safeGet = function (nestedObj, pathArr) {
        return pathArr.reduce((obj, key) => {
            return (obj && obj[key] !== 'undefined') ? obj[key] : undefined
        }, nestedObj);
    };

    $scope.average = function(array) {
        var filtered = array.filter(x => x !== undefined);
        var sum = filtered.reduce((acc, curr) => acc + curr, 0);
        return parseFloat((sum / array.length).toFixed(2));
    };
});
