
app.component("bullseyeChart", {
  bindings: {
    width: '<',
    height: '<',
    bullseyedata: '<',
    displayscorepopuponclick: '<',
    displayarccolor: '<',
    bullseyetitle: '<',
    onArcClick: '&',
    onUpdate: '&'
  },
  controller: ChartController,
  template: ['$templateCache', function ($templateCache) {
    return $templateCache.get('views/Workshops/Bullseye/bullseyechart.template.html')
  }]
});

function ChartController($state) {
  var ctrl = this;
  var loadComplete = false;
  var innerRadius = 100;
  var outerRadius = 200;
  var radiusWidth = outerRadius - innerRadius;
  ctrl.arcs = [];
  ctrl.score_type = 'journey_score';


  var zoom = d3.behavior.zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);

  function zoomed() {
    console.log('zommed')
    d3.select("#circle").attr("transform", "translate(865,695)scale(" + d3.event.scale + ")");
    d3.select("#segmentseperators").attr("transform", "translate(865,695)scale(" + d3.event.scale + ")");
    d3.select("#icons").attr("transform", "translate(865,695)scale(" + d3.event.scale + ")");
  }

  d3.select("#svgelement")
    .call(zoom);

  ctrl.$onInit = function () {
    if (!ctrl.bullseyedata) {
      return;
    }
    var bullseyedata = ctrl.bullseyedata;
    ctrl.strategies = bullseyedata.strategyTypes;
    ctrl.segments = bullseyedata.segments;
    ctrl.data = bullseyedata.intersection;
    initialize();
  }

  ctrl.changeScoreType = function () {
    // console.log('$scope.score_type')
  }

  function initialize() {
    ctrl.arcs = [];
    innerRadius = 100;
    outerRadius = 200;
    createArcsdata();
    drawCircle();
    drawStrategyTextElements();
    setupStrategyIcons();
    displayAverage();
  }

  ctrl.$onChanges = function (componentProperties) {
    console.log('changed something')
    if ((typeof componentProperties.bullseyedata !== 'undefined') && (typeof componentProperties.bullseyedata.currentValue !== 'undefined')) {

      var svg = d3.select("#svgelement");
      svg.selectAll("*").remove();
      svg.append('g')
        .attr("transform", "translate(865,695)")
        .attr('id', function (d) { return 'circle'; });
      svg.append('g')
        .attr("transform", "translate(865,695)")
        .attr('id', function (d) { return 'segmentseperators'; });
      svg.append('g')
        .attr("transform", "translate(865,695)")
        .attr('id', function (d) { return 'icons'; });

      var bullseyedata = componentProperties.bullseyedata.currentValue;
      ctrl.strategies = bullseyedata.strategyTypes;
      ctrl.segments = bullseyedata.segments;
      ctrl.data = bullseyedata.intersection;

      d3.select("#arcs").remove();
      initialize();
    }
  }

  function findElement(array, element) {
    if (!Array.isArray(array)) {
      return;
    }
    for (var i = 0; i < array.length; i++) {
      if (array[i].name === element) {
        return array[i];
      }
    }
  }

  function createArcsdata() {
    var radiusWidth = outerRadius - innerRadius;
    var baseangle = 0;
    var padding = 0.75;
    var result = 0;
    var len = 0;
    if (!ctrl.strategies) {
      return;
    }
    var segmentangle = 360 / ctrl.segments.length;
    for (var i = 0; i < ctrl.strategies.length; i++) {
      var strategy = '';
      var audience = '';
      var segment = '';
      var label = '';
      for (var j = 0; j < ctrl.segments.length; j++) {
        var crossangle = segmentangle / ctrl.segments[j].audiences.length;
        var startangle = j * segmentangle;

        for (var l = 0; l < ctrl.segments[j].audiences.length; l++) {
          startangle = l * crossangle + j * segmentangle;
          endangle = startangle + crossangle;
          strategy = ctrl.strategies[i];
          audience = ctrl.segments[j].audiences[l];
          segment = ctrl.segments[j];

          if (i === ctrl.strategies.length - 1) {
            label = audience;
          }
          var score = findScoreFromIntersection(ctrl.data, strategy, segment, audience, "arc_" + i + "_" + j + "_" + l);
          
          ctrl.arcs.push({
            name: score.uuid,
            scoreid: score.uuid,
            innerradius: innerRadius,
            outerradius: outerRadius,
            startangle: startangle,
            endangle: endangle,
            strategy: strategy,
            segment: segment.name,
            audience: audience.name,
            label: label.name,
            score: score,
            userValue: score.userValue
          });
        }
      }
      innerRadius += radiusWidth + padding;
      outerRadius += radiusWidth;
    }
    let count = 0;
    for (var i = 0; i < ctrl.data.length; i++) {
      // result += ctrl.data[i].avgJourneyScore;
      if(ctrl.data[i].averageScore !== null){
        result += parseInt(ctrl.data[i].averageScore);
        len = count++;

      }

    }
    ctrl.average = (result / (len+1)).toFixed(1);
  }

  function findScoreFromIntersection(data, strategy, segment, audience, _uuid) {
    var score = {
      uuid: _uuid,
      userValue: '',
      avgValue: '',
      scorelabel: '',
      userAccessed: false,
      isEnabled: false,
      comments:null,
    }
    for (var i = 0; i < data.length; i++) {
      if (data[i].strategytypeUuid === strategy.uuid && data[i].segmentUuid === segment.uuid && data[i].audienceUuid === audience.uuid) {
        score.userValue = data[i].userScore;
        score.avgValue = data[i].averageScore;
        score.arclabel = data[i].arclabel;
        score.uuid = data[i].intersectionUuid;
        score.comments = data[i].comments;
        score.strategytypeUuid = data[i].strategytypeUuid;
        if (score.userValue >= 0) {
          score.userAccessed = true;
        }
        score.isEnabled = true;
      }
    }
    // console.log("Score is ", score);
    return score;
  }

  // segment circle
  function drawCircle() {
    var baseangle = 360 / ctrl.segments.length;
    var startangle = 0;
    var endangle = baseangle;
    var circleRadius = innerRadius + 140;
    for (var i = 0; i < ctrl.segments.length; i++) {
      // console.log(ctrl.data[i].strategytypeUuid);
      drawArc(circleRadius, circleRadius + 1, startangle, endangle, ctrl.segments[i].name, "25%", "middle", "30px");
      drawSegmentSeperator(circleRadius, startangle);
      startangle += baseangle;
      endangle += baseangle;
    }
  }

  function drawSegmentSeperator(radius, startangle) {
    var τ = Math.PI;
    // point here basically is (rSin(teeta), rCos(teeta))
    var firstPoint = { x: (radius * Math.sin((τ * startangle) / 180)), y: ((radius * -Math.cos((τ * startangle) / 180))) };
    var thridPoint = { x: ((radius + 15) * Math.sin((τ * startangle) / 180)), y: (((radius + 15) * -Math.cos((τ * startangle) / 180))) };
    // The segment seperators should not intersect at the center of the circle
    var secondPoint = { x: (100 * Math.sin((τ * startangle) / 180)), y: ((100 * -Math.cos((τ * startangle) / 180))) };
    d3.selectAll("#segmentseperators")
      .append("line")
      .attr("x1", firstPoint.x)
      .attr("y1", firstPoint.y)
      .attr("x2", secondPoint.x)
      .attr("y2", secondPoint.y)
      .attr("stroke-width", 3)
      .attr("stroke", "#F9F1D5");

    d3.selectAll("#segmentseperators")
      .append("line")
      .attr("x1", firstPoint.x)
      .attr("y1", firstPoint.y)
      .attr("x2", thridPoint.x)
      .attr("y2", thridPoint.y)
      .attr("stroke-width", 2)
      .attr("stroke", "black");
  }


  function drawArc(innerRadius, outerRadius, startangle, endangle, segmentname, startOffset, textanchor, fontsize) {

    var arc = d3.svg.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startangle * Math.PI / 180)
      .endAngle(endangle * Math.PI / 180);
    svg = d3.select("#chart svg #circle");
    d3.selectAll("#circle")
      .append("path")
      .attr("class", "customer-arc")
      .attr("d", arc)
      .attr("id", function (d, i) { return "id_" + segmentname; });
      // .attr("testattr",function (d, i) { return "testid_" + segmentname; });
    svg.append("text")
      .attr("dy", -13)
      .append("textPath")
      .attr("startOffset", startOffset)
      .style("text-anchor", textanchor)
      .attr("xlink:href", function (d, i) { return "#id_" + segmentname; })
      .style("font-size", fontsize)
      .style("fill", "black")
      .text(segmentname);

  }

  function drawStrategyTextElements() {
    var radius = (radiusWidth / 2) + 75;
    for (var i = 0; i < ctrl.strategies.length; i++) {

      drawArc(radius, radius, 0, 90, ctrl.strategies[i].name, "2%", "start", "12px");
      radius += radiusWidth;
    }
  }

  function setupStrategyIcons() {
    var y = -1 * radiusWidth;
    y = y + 1.25 * y;
    var x = '-25';
    var size = '45';
    var bizStrategypng = 'build/images/bullseye/Biz.png';
    var brandStrategypng = 'build/images/bullseye/Brand.png';
    var experienceStrategypng = 'build/images/bullseye/Exp.png';
    var digStrategypng = 'build/images/bullseye/Digi.png';
    ctrl.strategyIcons = [
      bizStrategypng,
      brandStrategypng,
      experienceStrategypng,
      digStrategypng
    ]
    setupIcon(x, y, size, bizStrategypng, ctrl.strategies[0].name);
    y = y - radiusWidth;
    setupIcon(x, y, '55', brandStrategypng, ctrl.strategies[1].name);
    y = y - radiusWidth;
    setupIcon(x, y, size, experienceStrategypng, ctrl.strategies[2].name);
    y = y - radiusWidth;
    setupIcon(x, y, size, digStrategypng, ctrl.strategies[3].name);
  }

  function displayAverage() {
    var color = ctrl.average <= 4 ? "red" : ctrl.average > 4 && ctrl.average <= 7 ? "orange" : "#2AE02A";
    var average = ctrl.average.toString();
    var xvalue = average.length === 3 ? -45 : average.length === 2 ? -60 : -30;
    d3.select("#icons").append("svg:text")
      .style("font-size", "4em")
      .style("font-weight", "bold")
      .attr('x', xvalue)
      .attr('y', 35 - 10)
      .attr('title', 'Overall average score')
      .text(average)
    svg.append("circle")
      .attr('r', 100)
      .style('fill', color)

  }

  ctrl.getStrategyId = function (id) {
    if (!id) {
      return id;
    }
    return id.replace(' ', '_');
  }
  function setupIcon(x, y, size, icon, strategydivId) {
    d3.selectAll("#icons")
      .append("svg:image")
      .attr('x', x)
      .attr('y', y)
      .attr('width', size)
      .attr('height', size)
      .attr('xlink:href', icon)
      .on('mouseenter', function (d) {
        var stgdiv = document.getElementById(ctrl.getStrategyId(strategydivId));
        stgdiv.style.opacity = 1;
        stgdiv.style.left = d3.event.pageX - 150 + "px";
        stgdiv.style.top = d3.event.pageY - 50 + "px";
        stgdiv.style.position = 'absolute';
      })
      .on('mouseleave', function (d) {
        var stgdiv = document.getElementById(ctrl.getStrategyId(strategydivId));
        stgdiv.style.opacity = 0;
      });
  }
  ctrl.arclicked = function (intersectionuuid) {
    // Make a service call and save the data model
    ctrl.onArcClick({ intersectionuuid: intersectionuuid });
  }

  ctrl.scoreUpdateCallback = function (selectedScore, scoreid) {
    score = selectedScore;
    scoreid = scoreid;
    var arc = findElement(ctrl.arcs, scoreid);
    if (arc) {
      arc.score.userScore = selectedScore;
      //arc.score.avgValue = selectedScore;
      arc.score.arclabel = arc.score.avgValue + '(' + selectedScore + ')';
      arc.score.userValue = selectedScore;
      arc.score.userAccessed = true;
      arc.userValue = selectedScore;
    
    }
    $state.reload();
    ctrl.onUpdate({ uservote: selectedScore, intersectionuuid: scoreid });
  }
}
