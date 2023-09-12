function journeyMapReportCtrl(journey, $scope, Timeline, $http, $window, $location, $stateParams, $rootScope, $state, $timeout) {
   // load all data
    $scope.journey = journey;
    $scope.isGroup = $stateParams.group;

    $scope.journey.painpoints = 0;
    $scope.UnSelectedPersonas = [];
    $scope.UnSelectedInteractions = [];
    // for journey report
    $scope.showPainLanes = false;
    // for persona/profile report
    $scope.showPainLists = false;
    $scope.showNoteAuthors = false;
    $scope.showVoteCounts = false;
    $scope.showVoc = false;
    $scope.usedInteractions = { index: [] };
    $scope.usedPersonas = { index: [] };
    $scope.todaysDate = new Date().getTime();

    $scope.cxiPriority = false;

    $scope.showKpis = (journey.kpis.length > 0);

    $scope.PrintPersonaReport = function (){
        window.print();
    }

    $scope.togglePainLanes = function(){
      $scope.showPainLanes = !$scope.showPainLanes;
    }
    $scope.togglePainLists = function(){
      $scope.showPainLists = !$scope.showPainLists;
    }

    $scope.isBrainstormStage = (stage) => {
      return ($scope.journey.workshop_type === 'brainstorm' && stage.title.includes('_'))
    }


    // HANDLE SELECTING/DESELCTING PERSONAS
    $scope.togglePersona = function (int) {
      var arr = $scope.UnSelectedPersonas;
      var idx = arr.indexOf(int.uuid)
      idx > -1 ? arr.splice(idx, 1) : arr.push(int.uuid);
      $scope.UnSelectedPersonas = arr;
    }
    $scope.deselectAll = function(allPersonas){
      allPersonas = allPersonas.map(function(persona){
        return persona.uuid
      })
      $scope.UnSelectedPersonas = allPersonas;
    }
    $scope.selectAll = function(){
      $scope.UnSelectedPersonas = [];
    }
    let sortedInteraction = $scope.journey.interactions;
    let type = $location.path().split("/")[2]
    sortedInteraction.sort((a, b) => a.order - b.order);
    // sortedInteraction.forEach(function(val){
    //     if(type == "profile"){
    //         if(val.order !=0){
    //             $scope.UnSelectedInteractions.push(val.uuid);
    //         }
    //     } else {
    //         if(val.order !=0 && val.order !=1){
    //             $scope.UnSelectedInteractions.push(val.uuid);
    //         }
    //
    //     }
    // });

    // $scope.UnSelectedInteractions = [sortedInteraction.interactions[0].uuid];
    // HANDLE SELECTING/DESELCTING INTERACTIONS
    $scope.toggleInteraction = function (int) {
      console.log('toggle')
      var arr = $scope.UnSelectedInteractions;
      var idx = arr.indexOf(int.uuid)
      idx > -1 ? arr.splice(idx, 1) : arr.push(int.uuid);

      $scope.UnSelectedInteractions = arr;
    }
    // sentiment
    $http.get('/api/journey/sentiment/'+$stateParams.uuid)
    .then(resp => {
      $scope.journey.sentiment = resp.data;
    })

    // KPI's
    $scope.journeyScore = 0;



    $scope.journey.kpis.map(function(kpi){
      kpi.score = parseFloat(kpi.rel.score || 0).toFixed(1);
      $scope.journeyScore += parseFloat(kpi.score);
      return kpi;
    })
    $scope.journeyScore = ($scope.journeyScore / $scope.journey.kpis.length).toFixed(1);

    $scope.journey.stagesOnly = angular.copy($scope.journey.stages);

    // stages & notes
    $scope.doneLoopingStages = false;
    $scope.stagesOnly = angular.copy($scope.journey.stages);

    let params = {
      'interaction_orders': $scope.journey.interaction_orders,
      'nocache': new Date().getTime()
    }

    if($scope.isGroup) params.group = true;

    $scope.journey.stages.map(function(stage, idx){
      $http({
        method: 'GET',
        url: '/api/journey/'+$stateParams.uuid+'/stage/'+stage.uuid,
        params: params

      }).then(function(resp){
        let noteTitle = [];
        stage.notes = resp.data;
        stage.notes.forEach(function(note){
          if($scope.usedInteractions.index.indexOf(note.rels.interaction.uuid) < 0) {
            $scope.usedInteractions.index.push(note.rels.interaction.uuid);
            $scope.usedInteractions[note.rels.interaction.uuid] = 1;
          } else {
            $scope.usedInteractions[note.rels.interaction.uuid] += 1;
          }
          if($scope.usedPersonas.index.indexOf(note.rels.persona.uuid) < 0) {
            $scope.usedPersonas.index.push(note.rels.persona.uuid);
            $scope.usedPersonas[note.rels.persona.uuid] = 1;
          } else {
            $scope.usedPersonas[note.rels.persona.uuid] += 1;
          }
          if(note.rels.pains_count > 0){
            $scope.journey.painpoints += 1;
          }

        noteTitle.push(note.rels.interaction.title)

        // noteTitle.reduce(function(title,index){
        //     console.log(title)
        // });
        noteTitle = noteTitle.filter( function( item, index, inputArray ) {
           return inputArray.indexOf(item) == index;
        });


        })
        // console.log(noteTitle);

        let notes = stage.notes;
        let personaNotes = noteTitle.map(function(e){
           return(notes.filter((note)=>{
               if(note.rels.interaction.title == e){
                   return stage.notes[e] = note
               }
               },{}));
       })
        stage.personaNotes =personaNotes;
        return stage;
      })
      if(idx == $scope.journey.stages.length - 1) $scope.doneLoopingStages = true;
    })
    $timeout(function(){
      // console.log($scope.journey)
    }, 1000)
    $scope.journey.interactions.map(function(int){
      int.score = 10;
      return;
    })

    // return to previous state
    $scope.gotoPrevState = function(uuid) {
      $state.go('workshop.journey', {id: uuid})
    }
    $scope.defaultImage = {
      interaction: '/bullseye/Biz.png'
    }
    $scope.screenshotConfig = {
      "filename"    : "report-screenshot.png",
      "cancelText"  : "cancel",
      "downloadText": "download"
    }
    $scope.saveReport = function(){

      // let clone = doc.cloneNode(true);
      let button_bar = document.getElementById('button_bar');
      let doc = document.getElementById('journey_report');
      // doc.removeChild(doc.childNodes[0])
      // console.log(button_bar)
      let report = {
        doc : document.getElementById('journey_report').outerHTML.replace(/<!--[\s\S]*?-->|[\r\n]+/g, ''),
        time: Date.now(),
        journey: $scope.journey,
        touchpoints: $scope.touchpoints,
        notes: $scope.journey.notes
      }
      Timeline.journey.save(report);
    }
}
