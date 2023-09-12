// FILE DEPRECATED !!!!!!!!!!!!!


app.controller('JourneyGraphsCtrl', function(journey, $scope, $stateParams, $http, $q, $filter, $timeout, $window) {
  $scope.journey = journey;
  $scope.journey.interactions = $filter('orderBy')($scope.journey.interactions, 'order');
  $scope.journey.stages = $filter('orderBy')($scope.journey.stages, 'order');

  $scope.filters = [];

  $scope.canvases = {}
  $scope.axisProperties = [
    {
      label: 'Importance / Impact',
      property: 'average_importance'
    },
    {
      label: 'Effectiveness / Effort',
      property: 'average_effectiveness'
    }
  ]
  var letters = ['a', 'b', 'c', 'd', 'e', 'f']
  letters.forEach(function(letter){
    $scope.axisProperties.push({
      label: 'Correlation ' + letter,
      property: 'correlation_' + letter
    })
  })
  var numbers = ['1', '2', '3']
  numbers.forEach(function(letter){
    $scope.axisProperties.push({
      label: 'Custom Index ' + letter,
      property: 'index_' + letter
    })
  })

  $scope.init = function(stage, graphNo, interaction, xAxis, yPlus, yMinus) {
    $scope.calculateDataPoints = function(stage, interaction, xAxis, yPlus, yMinus) {
      return $q(function(resolve, reject) {

        let correlations = ['correlation_a', 'correlation_b', 'correlation_c', 'correlation_d', 'correlation_e', 'correlation_f']
        stage.notes.map(function(note){

          if(note.rels.interaction.uuid === interaction.uuid) {

            note.loyaltyIndex    = 0;
            note.experienceIndex = 0;
            if(!note.correlation_a) {
              note.correlation_a = note.correlation;
            }
            correlations.forEach(function(c) {
              if(note[c]){
                if(typeof(note[c]) !== 'object' && JSON.parse(note[c])){
                  note[c] = JSON.parse(note[c]).value
                } else if(typeof(note[c]) === 'object') {
                  note[c] = note[c].value
                } else {
                  note[c] = parseInt(note[c])
                }
              }
            })
            var x = 0;
            var y_plus = 0;
            var y_minus = 0;

            if(xAxis && yPlus){
              if(xAxis.property.indexOf('index') > -1) {
                JSON.parse($scope.journey[xAxis.property]).forEach(function(obj) {
                  x += (note[obj.property] || 0)
                })
                x / JSON.parse($scope.journey[xAxis.property]).length;
              } else { x = note[xAxis.property] || 0 }

              if(yPlus.property.indexOf('index') > -1) {
                JSON.parse($scope.journey[yPlus.property]).forEach(function(obj) {
                  y_plus += (note[obj.property] || 0)
                })
                y_plus / JSON.parse($scope.journey[yPlus.property]).length;
              } else { y_plus = note[yPlus.property] || 0 }

              if(yMinus) {
                if(yMinus.property.indexOf('index') > -1) {
                  JSON.parse($scope.journey[yMinus.property]).forEach(function(obj) {
                    y_minus += (note[obj.property] || 0)
                  })
                  y_minus / JSON.parse($scope.journey[yMinus.property]).length;
                } else { y_minus = note[yMinus.property] || 0 }
                y_minus = y_minus * -1;
              }
              // x = xAxis ? note[xAxis.property] : 0;
              // y_plus = yPlus ? note[yPlus.property] : 0;
              // y_minus = yMinus ? (note[yMinus.property] || 0) * -1 : 0;

              if(y_plus > 0 && x > 0) {
                stage[interaction.uuid].x.loyalty.push({x: x.toFixed(2), y: y_plus.toFixed(2), text: (note.description || '')})
              }
              if(y_minus < 0 && x > 0) {
                stage[interaction.uuid].x.experience.push({x: x.toFixed(2), y: y_minus.toFixed(2), text: (note.description || '')})
              }
            }
          }
          return;
        })
        resolve();
      })
    }

    $scope.plotGraph = function(stage, graphNo, interaction){
      // console.log('look at this', xAxis)
      // console.log('scatter-'+interaction.uuid)
      $window['scatter-'+interaction.uuid] = Chart.Scatter($scope.canvases[stage.uuid+'-'+graphNo], {
        data: {
          datasets: [{
            label: yPlus.label+":  ",
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            pointBorderColor: 'blue',
            pointBackgroundColor: 'blue',
            pointBorderWidth: 2,
            data: stage[interaction.uuid].x.loyalty
          },{
            label: xAxis.label+":  ",
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            pointBorderColor: 'black',
            pointBackgroundColor: 'black',
            pointBorderWidth: 2,
            data: stage[interaction.uuid].x.experience
          }]
        },
        options: {
          responsive: true,
          hoverMode: 'nearest',
          title: {
            display: false,
            text: 'Enhanced Kano Chart'
          },
          legend: {
          	display: false
          },
          tooltips: {
          	callbacks: {
            	label: function(tooltipItem, data) {
              	return data.datasets[tooltipItem.datasetIndex].label + tooltipItem.yLabel.toString().replace('-', '');
              },
              afterBody: function(tooltipItem, data) {
                if(data.datasets[0].data[tooltipItem[0].index]){
                  var text = data.datasets[0].data[tooltipItem[0].index].text;
                  if(text && text.length > 30) {
                    text = text.match(/.{30}\w*\W*|.*/g);
                    text.unshift('');
                    text.push('');
                  } else {
                    text = ['', text, ''];
                  }
                	return text;
                }
                return '';
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
                display: true,
                // labelString: 'Average'
              },
              // ticks: {
              //   min: journey.x
              // }
            }],
            yAxes: [{
              ticks: {
                callback: function(value, index, values) {
                  return value.toFixed(1).replace('-', '');
                }
              },
              name: 'y',
              position: 'left',
              gridLines: {
                zeroLineColor: "rgba(0,255,0,1)"
              },
              scaleLabel: {
                display: true,
                // labelString: 'Correlation to Usage | Correlation to Loyalty'
              }
            }]
          },
        	// annotation: {
        	// 	// Defines when the annotations are drawn.
        	// 	// This allows positioning of the annotation relative to the other
        	// 	// elements of the graph.
        	// 	//
        	// 	// Should be one of: afterDraw, afterDatasetsDraw, beforeDatasetsDraw
        	// 	// See http://www.chartjs.org/docs/#advanced-usage-creating-plugins
        	// 	drawTime: 'afterDatasetsDraw', // (default)
          //
        	// 	// Mouse events to enable on each annotation.
        	// 	// Should be an array of one or more browser-supported mouse events
        	// 	// See https://developer.mozilla.org/en-US/docs/Web/Events
        	// 	events: ['click'],
          //
        	// 	// Double-click speed in ms used to distinguish single-clicks from
        	// 	// double-clicks whenever you need to capture both. When listening for
        	// 	// both click and dblclick, click events will be delayed by this
        	// 	// amount.
        	// 	dblClickSpeed: 350, // ms (default)
          //
        	// 	// Array of annotation configuration objects
        	// 	// See below for detailed descriptions of the annotation options
        	// 	annotations: [{
        	// 		drawTime: 'afterDatasetsDraw', // overrides annotation.drawTime if set
        	// 		id: 'a-line-1', // optional
        	// 		type: 'line',
        	// 		mode: 'horizontal',
        	// 		scaleID: 'y',
        	// 		value: 1,
        	// 		borderColor: 'red',
        	// 		borderWidth: 2,
          //
        	// 		// Fires when the user clicks this annotation on the chart
        	// 		// (be sure to enable the event in the events array below).
        	// 		onClick: function(e) {
        	// 			// `this` is bound to the annotation element
        	// 		}
        	// 	}]
        	// }
        }
      });
    }

    $scope.journey.stages.map(function(stage){
      $scope.journey.interactions.forEach(function(interaction){
        stage[interaction.uuid]  = {};
        stage[interaction.uuid]['x'] = {loyalty: [], experience: []}
        // stage[interaction.uuid]['x'+graphNo] = {loyalty: [], experience: []}
      })
      $timeout(function(){
        $scope.canvases[stage.uuid+'-1'] = document.getElementById("canvas-1-"+stage.uuid).getContext("2d");
        $scope.canvases[stage.uuid+'-2'] = document.getElementById("canvas-2-"+stage.uuid).getContext("2d");
      }, 500)
      $http({
        method: 'GET',
        url: '/api/journey/'+$stateParams.id+'/stage/'+stage.uuid,
        params: {
          'interaction_orders': $scope.journey.interaction_orders,
          'nocache': new Date().getTime()
        }
      }).then(function(resp){
        stage.notes = resp.data;
        return stage;
      })

    })

    // console.log('the journey ', $scope.journey)
    $timeout(function(){
      $scope.calculateDataPoints(stage, interaction, xAxis, yPlus, yMinus).then(function(){
        $scope.plotGraph(stage, graphNo, interaction);
      });
    }, 1500);
  }

  // $scope.init = function(stage, graphNo, interaction, xAxis, yPlus, yMinus){
  //   init(stage, graphNo, interaction, xAxis, yPlus, yMinus);
  // }


  // $scope.averageValues = function(a, b) {
  //   var n = 0;
  //   a.forEach(function(obj) {
  //     console.log($scope.journey[obj.property])
  //     n += $scope.journey[obj.property];
  //   })
  //   var avg = n / a.length;
  //   console.log(avg)
  // }
// stage, graphNo, stage['canvas-'+graphNo+'-'+'interaction'], axisProperties[graphNo-1].property
})
