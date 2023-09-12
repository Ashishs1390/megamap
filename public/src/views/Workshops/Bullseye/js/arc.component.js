
app.component("bullseyeArc", {
  bindings: {
    scoreid: "<",
    displayscorepopuponclick: "<",
    displayarccolor: "<",
    startAngle: "<",
    endAngle: "<",
    innerRadius: "<",
    outerRadius: "<",
    padding: "<",
    strategy: "<",
    segment: "<",
    audience: "<",
    svgParent: "@",
    label: "<",
    score: "<",
    scorelabel: "<",
    userScore: "<",
    arcClicked: "&",
    scoreUpdateCallback: "&"
  },
  controller: ArcController,
  template: ['$templateCache', function ($templateCache) {
    return $templateCache.get('views/Workshops/Bullseye/arc.template.html')
  }]
});

function ArcController($window, $rootScope,$location,WorkshopBullseyeAPI,$stateParams) {
  var ctrl = this;
  var svg;
  var arc;
  var scoreElement;
  var poorColor = 'red';
  var avgColor = 'orange';
  var goodColor = '#2AE02A';
  
  ctrl.$onInit = function () {
    initializeSlider();
    drawArc(ctrl.innerRadius, ctrl.outerRadius, ctrl.startAngle, ctrl.endAngle);
  };

  function initializeSlider() {
    var scoreValue = 0;
    if (ctrl.score && ctrl.score.userValue) {
      scoreValue = ctrl.score.userValue;
    }

    ctrl.slider = {
      value: scoreValue,
      options: {
        floor: 0,
        ceil: 10,
        showSelectionBar: true,
        getPointerColor: function (value) {
          return getPerfColor(value);
        },
        getSelectionBarColor: function (value) {
          return getPerfColor(value);
        }
      }
    }
  }

  function getPerfColor(value) {
    if (value <= 4)
      return poorColor;
    if (value <= 7)
      return avgColor;
    return goodColor;
  }

  function getPerfClass(value) {
    if (value <= 4)
      return 'poor-perf-arc';
    if (value <= 7)
      return 'avg-perf-arc';
    return 'good-perf-arc';
  }

  ctrl.$onChanges = function (componentProperties) {
    if ((typeof componentProperties.userScore !== 'undefined') && (typeof componentProperties.userScore.currentValue !== 'undefined')) {
      drawArc(ctrl.innerRadius, ctrl.outerRadius, ctrl.startAngle, ctrl.endAngle);
    }
  }

  function drawArc(innerRadius, outerRadius, startangle, endangle) {
    svg = d3.select("#" + ctrl.svgParent + " svg > g");
    var id = ctrl.scoreid;
    var label = ctrl.label;
    var score = ctrl.score;
    arc = d3.svg.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startangle * Math.PI / 180)
      .endAngle(endangle * Math.PI / 180)
      .padAngle(0.001);
    setArcColor(svg, arc, id);
    setSegmentLabel(svg, label, id, startangle, endangle);
    if (score && score.avgValue && ctrl.score.isEnabled) {
      setScore(svg, score);
    }
  }

  function setArcColor(svg, arc, id) {
    var arcClass = 'arc';
    if (ctrl.score && ctrl.score.avgValue && ctrl.displayarccolor) {
      arcClass = getPerfClass(ctrl.score.avgValue);
    }
    if (ctrl.score && !ctrl.score.isEnabled) {
      arcClass = 'disabled-arc';
    }
    if (ctrl.score.isEnabled) {
      svg.append("path")
        .attr("class", arcClass)
        .attr("d", arc)
        .attr("id", function (d, i) { return "id_" + id; })
        .on("click", arcClick);
    }
    else {
      svg.append("path")
        .attr("class", arcClass)
        .attr("d", arc)
        .attr("id", function (d, i) { return "id_" + id; });
    }
  }


  function enableClick(score) {
    if (score && score.isEnabled) {
      svg.on("click", arcClick);
    }
  }

  function setSegmentLabel(svg, label, id, startangle, endangle) {
    var pi = Math.PI;
    var radius = 510;
    if (label !== undefined) {
      var point = startangle + (endangle - startangle) / 1.8;
      var x = radius * Math.sin((pi * point) / 180);
      var y = radius * -Math.cos((pi * point) / 180);
      var rotateAngle, anchorText;
      if(point < 180){
        rotateAngle = (startangle + 10) - 90;
        anchorText = "start";
      }else{
        rotateAngle = (startangle + 20) + 90;
        anchorText = "end";
      }
      svg.append("text")
        .attr("dy", -13)
        .attr("transform", function (d, i) {
          return "translate(" + x + "," + y + ") rotate("+rotateAngle+")";
        })
        .style("text-anchor", anchorText)
        .attr("xlink:href", function (d, i) { return "#id_" + id; })
        .text(label);
    }
  }

  function setScore(svg, score) {
    var scoreColor = getPerfColor(score.avgValue);

    var circle = svg.append("circle")
      .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("cx", function (d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("cy", function (d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("r", "10")
      .style("opacity", "0");
    svg.append("text")
      .attr("transform", function (d) {
        var x = arc.centroid(d)[0] - 5;
        var y = arc.centroid(d)[1] + 5;
        return "translate(" + x + "," + y + ")";
      })
      .text(score.arclabel)
      .style("font-size", "15px");
  }

  function arcClick() {

      let toDisplatNone = document.getElementsByClassName('scorebox');
      for (let item of toDisplatNone) {
        item.style.display = "none";
      }

    if (ctrl.displayscorepopuponclick !== true) {
      ctrl.arcClicked({ intersectionuuid: ctrl.scoreid });
      return;
    }
    initializeSlider();
    var x = window.innerWidth / 2 + d3.mouse(this)[0];
    var y = window.innerHeight / 2 + d3.mouse(this)[1];
    scoreElement = document.getElementById(ctrl.scoreid);
    scoreElement.style.left = x + 'px';
    scoreElement.style.top = y + 'px';
    scoreElement.style.display = "block";
    $rootScope.$broadcast('reCalcViewDimensions')
  }

  ctrl.hideScorebox = function () {
    scoreElement = document.getElementById(ctrl.scoreid);
    scoreElement.style.display = "none";
    if (!ctrl.score || ctrl.slider.value !== ctrl.score.userValue) {
      ctrl.scoreUpdateCallback({ selectedScore: ctrl.slider.value, scoreid: ctrl.scoreid });
    }
  }
  ctrl.newComment = {
    msg:'',
  };
  ctrl.newCommentToAdd = {
    properties : {}
  }; 

  ctrl.postSliderComment = function(){
    let obj = {
      person:$rootScope.Person.properties.uuid,
      bullseyeId:$location.search().id,
      scoreId: ctrl.scoreid,
      comment: ctrl.newComment.msg,
      uuid: uuidv4()
    }
     
    WorkshopBullseyeAPI.PostBulleyesComments(obj).then((result)=>{
      console.log('success');
    });
  }


  ctrl.deleteComment = function(comment,scoreId) {
    let {uuid,personuuid} = comment.properties;
    let obj = {};
    obj.personuuid = personuuid;
    obj.intersectionuuid = scoreId;
    obj.commentid = uuid;
    obj.bullseyeid = $location.search().id
      const filteredArr = ctrl.score.comments.filter((obj)=>{
        if(obj.properties.uuid !== uuid){
          return  obj;
        }
      }); 
      ctrl.score.comments = {};
      ctrl.score.comments = filteredArr;
      
    WorkshopBullseyeAPI.DeleteBulleyesComment(obj).then(function(result){
      console.log("deleted successfully");
    })
  }
   $rootScope.$on("getCommentsData" , function(event ,dataObj){
    if(!dataObj) return;
    var data;
    ctrl.showComments = [];

     Object.keys(dataObj).forEach(function (action) {
        data = dataObj[action];
        switch(action){
          case 'delete.comment':
            $('#comment_' + data.comment).remove();
            break;

          case 'add.comment':
            let {comment,persondetails,createDate,uuid,statergyId,scoreId} = data;
            
            if(ctrl.scoreid == scoreId && ctrl.strategy.uuid == statergyId){
              let newComment = {
                properties : {}
              };
              newComment.properties.firstname = persondetails;
              newComment.properties.comment = comment;
              newComment.properties.created_at = createDate;
              newComment.properties.uuid = uuid;
              ctrl.score.comments.unshift(newComment);
            }
            
            break;
          default:
            console.log('Action "' + action + '" is not defined');
        }
     });
   });
}
  
