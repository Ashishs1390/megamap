app.controller('JourneyGraphsCtrl3', function(journey, $scope, $rootScope, $stateParams, $http, $q, $filter, $timeout, $window , $state) {
  var canvas = document.getElementById("graph").getContext("2d");
  var graph;
  var firstLoop = true;
  var correlations = ['correlation_a', 'correlation_b', 'correlation_c', 'correlation_d', 'correlation_e', 'correlation_f']
  $scope.journey = journey;
  $scope.kano = false;

  console.log('Loading Graph', journey)

  $scope.journey.interactions = $filter('orderBy')($scope.journey.interactions, 'order');
  $scope.journey.stages = $filter('orderBy')($scope.journey.stages, 'order');
  $scope.allStages = {
    title: 'All Stages',
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
  $scope.axisProperties = [{
    label: 'Importance / Impact',
    property: 'average_importance'
  }, {
    label: 'Effectiveness / Effort',
    property: 'average_effectiveness'
  }, {
    label: 'Eff-Imp',
    property: 'gap_c'
  }]
  correlations.forEach(function(correlation){
    if( $scope.journey[correlation] ) {
      $scope.axisProperties.push({
        label: JSON.parse($scope.journey[correlation]).label || correlation.replace('_', ' '),
        property: correlation
      })
    }
  })
  var numbers = ['1', '2', '3']
  numbers.forEach(function(letter){
    $scope.axisProperties.push({
      label: 'Custom Index ' + letter,
      property: 'index_' + letter
    })
  })

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
    dataset4: [],
    dataset1colors: [],
    dataset2colors: []
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
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      pointBorderColor: $scope.graphData.dataset1colors,
      pointBackgroundColor: $scope.graphData.dataset1colors,
      pointBorderWidth: 2,
      data: $scope.graphData.dataset1
    },{
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      pointBorderColor: $scope.graphData.dataset2colors,
      pointBackgroundColor: $scope.graphData.dataset2colors,
      pointBorderWidth: 2,
      data: $scope.graphData.dataset2
    }]
    if($scope.average_grids) {
      datasets.push({
        borderColor: 'black',
        backgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBackgroundColor: 'transparent',
        pointBorderWidth: 2,
        data: $scope.graphData.dataset3
      },{
        borderColor: 'black',
        backgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBackgroundColor: 'transparent',
        pointBorderWidth: 2,
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
            var chartData = activePoints[0]['_chart'].config.data;
            var idx = activePoints[0]['_index'];

            //var label = chartData.labels[idx];
            var isStageFound = false;
            var currNote = $scope.graphData.stage.notes[idx];
            var currNoteStage;
            $scope.notes = [];
            for(var i =0 ; i< $scope.journey.stages.length; i++) {
              $scope.notes = $scope.notes.concat($scope.journey.stages[i].notes.filter(function(note){
                return (note.average_effectiveness != undefined && $scope.currNotesOnGraph.filter(currNote => (currNote && currNote.uuid === note.uuid)).length >0)
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
          text: 'Enhanced Kano Chart'
        },
        legend: {
          display: false
        },
        tooltips: {
          displayColors: false,
          callbacks: {
            label: function(tooltipItem) {
              // debugger;
              // var a =$scope.graphData;
              var labels = []
              //if(tooltipItem.datasetIndex <= 0){
                if(tooltipItem.yLabel > 0) {
                  labels.push($scope.labels[0] + ': ' + tooltipItem.xLabel);
                  labels.push($scope.labels[1] + ': ' + tooltipItem.yLabel);
                  if($scope.labels[0] == 'Importance / Impact' || $scope.labels[0] == 'Effectiveness / Effort' && $scope.labels[1] == 'Importance / Impact' || $scope.labels[1] == 'Effectiveness / Effort' ){
                    labels.push('Eff-Imp: ' + (parseFloat(tooltipItem.yLabel) - parseFloat(tooltipItem.xLabel)).toFixed(2));
                  }
                }
                if(tooltipItem.yLabel < 0) {
                  if($scope.labels.length < 3) {
                    labels.push($scope.labels[0] + ': ' + tooltipItem.xLabel);
                  }
                  if($scope.labels[2]) {
                    labels.push($scope.labels[2] + ': ' + tooltipItem.yLabel);
                  } else {
                    labels.push($scope.labels[1] + ': ' + tooltipItem.yLabel);
                  }
                }
                return labels;
              //}
            },
            afterBody: function(tooltipItem, data) {

              var text;debugger;
              if(tooltipItem.length == 1){
                 if(data.datasets[0].data[tooltipItem[0].index]){
                text = data.datasets[0].data[tooltipItem[0].index].text;
              } else if(data.datasets[1].data[tooltipItem[0].index]) {
                text = data.datasets[1].data[tooltipItem[0].index].text;
              }
              //if(text && text.length > 30) {
                text = text.match(/.{30}\w*\W*|.*/g);
                text.unshift('');
                text.push('');
              // } else {
              //   text = ['', text, ''];
              // }
              return text;
              }
            }
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
              display: true
            },
            ticks: {
              beginAtZero: true,
              max: 10,
              callback: function(value, index, values) {
                // console.log(values)
                return value.toFixed(1).replace('-', '');
              }
            },
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true,
              max: 10,
              callback: function(value, index, values) {
                // console.log(values)
                return value.toFixed(1).replace('-', '');
              }
            },
            name: 'y',
            position: 'left',
            gridLines: {
              zeroLineColor: "rgba(0,255,0,1)"
            },
            scaleLabel: {
              display: true
            }
          }]
        }
      }
    });
  }

  $scope.calculateDataPoints = function() {
    $scope.currNotesOnGraph = [];
    if(!$scope.graphData.y_plus && !$scope.graphData.y_minus) return;

    $scope.graphData.dataset1 = [];
    $scope.graphData.dataset2 = [];
    $scope.graphData.dataset3 = [];
    $scope.graphData.dataset4 = [];
    $scope.graphData.dataset1colors = [];
    $scope.graphData.dataset2colors = [];

    $scope.setLabels();

    var high_x, low_x, high_y, low_y, x_average, y_average;

    var averages = {
      x: [],
      y: []
    }

    $scope.allStages.notes.map(function() {

    })
    $scope.graphData.stage.notes.map(function(note){
      if(note){
      $scope.average_grids = true;

      // if($scope.graphData.stage === $scope.allStages) {
      //   console.log('this is all the stages!')
      // }

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
        var redDot = false;

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

          } else if($scope.graphData[key] && note[$scope.graphData[key].property]) {
            if(typeof note[$scope.graphData[key].property] === 'number') {
              points[key] = note[$scope.graphData[key].property] || 0;
            } else if(typeof(note[$scope.graphData[key].property]) === 'object'){
              points[key] = note[$scope.graphData[key].property].value || 0;
            }

            if($scope.graphData[key].property === 'average_importance' || $scope.graphData[key].property === 'average_effectiveness') {
              if(note[$scope.graphData[key].property]) {
                $scope.currNotesOnGraph.push(note);
                redDot = ((note[$scope.graphData[key].property] - ($scope.journey.desired_score || 8)) < 0)
              }
            }
          }

          if($scope.kano) {
            redDot = (((note.average_effectiveness || 0) - (note.average_importance || 0)) < 0)
          }
          if(key === 'y_minus') {
            points[key] = points[key] * -1;
          }
        })
        // push data points
        //debugger;

        if(points.y_plus > 0 && points.x > 0) {
          averages.x.push(points.x);
          averages.y.push(points.y_plus);
          console.log(note);
          $scope.graphData.dataset1.push({x: points.x.toFixed(2), y: points.y_plus.toFixed(2), text: (('Primary KPI: ' + note.primary_kpi_label + '\n' + note.description) || '')})
          $scope.graphData.dataset1colors.push(redDot ? 'red' : 'blue');
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

          $scope.graphData.dataset2.push({x: points.x.toFixed(2), y: points.y_minus.toFixed(2), text: (note.description || '')})
          $scope.graphData.dataset2colors.push(redDot ? 'red' : 'blue');

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
        $scope.graphData.dataset3 = [{x: 0, y: y_average}, {x: 10, y: y_average}];
        $scope.graphData.dataset4 = [{x: x_average, y: 0}, {x: x_average, y: 10}];
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
