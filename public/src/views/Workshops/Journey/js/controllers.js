app.controller('productJourneyCtrl', function (UITracking, Pubnub, SortProperties, Activity, journey, journeyConnections, JourneyAPI, $document, $rootScope, $filter, $http, $scope, $stateParams, JourneyWorkshopAPI, $state, $uibModal, sweetAlert, $window, $timeout, $location) {
  console.log(journey)

  $scope.journey = journey;
  $scope.isGroup = $stateParams.group;

  $scope.journeyConnections  = journeyConnections.objects;
  $scope.journeyConnectionFromUuids = journeyConnections.from_uuids;
  $rootScope.connectionNotes = journeyConnections.objects;
  $scope.showComments = false;
  $scope.FilterObj = {isFilterChanged : false} // Added this variable to close comment boxes on each filter change
  $scope.UnSelectedInteractions = [];
  $scope.UnSelectedPersonas = [];
  $scope.newComments = {};
  $scope.currentStage = {};
  $scope.defaultInteraction = {};
  $scope.defaultPersona = {};
  $scope.newComment = '';
  $scope.editNote = false;
  $scope.mergeMode = false;
  $scope.connectMode = false;
  $scope.showConnections = false;
  $scope.connections = [];
  $scope.todaysDate = new Date().getTime();
  $scope.noteCardOrder = $scope.journey.sort_notes_by || 'rels.interaction.order';
  // $rootScope.connectionNotes = [];
  $scope.starcount = 10;
  $scope.stats = [];
  $scope.votingTable = [];
  $scope.journey.mots = []
  $scope.stopwatchAction = 2;
  $scope.whiteboard = false;
  $scope.showPositions = false;
  $scope.isMultiselect = false;
  $rootScope.$on("whiteboard" , function(event , param){
    $scope.whiteboard = param;
  });

  $scope.allNotes = []
  // UITracking.start();

  $scope.hasInnerText = (htmlString) => {
    if(htmlString) {
      htmlString.replace(/\s+((?=\<)|&nbsp;|(?=$))/g, '')

      return !['', '<p><br></p>'].includes(htmlString)
    }
    else return false
  }

  $scope.FlattenGroup = group => {
    swal({
      title: "Flatten Group",
      text: "Create a flattened copy of this group?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "green",
      confirmButtonText: "Yes!"
    },
       () => {
        $http.post('/api/journey/group/flatten', { group })
        .then(resp => {
          console.log(resp.data)

          $state.reload('workshop.journey', {
            id: resp.data.journey_uuid,
            group: null
          });
        })
        .catch(error => {
          console.error(error)
        })
      });
  }

  $scope.getMOTvalues = (note) => {
    $rootScope.motAverageBreakdowns = {}
    note.mots = {}

    let text_fields = [
      'mot_description', 'mot_lts', 'mot_sts'
    ]

    text_fields.forEach(key => { delete note[key] })

    $http.get(`/api/journey/note/mots/${note.uuid}/${$stateParams.id}`)
    .then(resp => {
      note.mots = resp.data

      Object.keys(note.mots.me).forEach(key => {
        note[key] = note.mots.me[key]

        // breakdown averages
        $rootScope.motAverageBreakdowns[key] = note.mots.inputs.reduce((result, input) => {
          if(input.values[key]) {
            result.push({
              person:  input.person,
              value:   input.values[key],
              updated: input.values.updated_at
            })
          }
          return result;
        }, [])
      })
    })
    .catch(err => console.error(err))
    // .finally(() => )

    $scope.MOTsolutionNotes = $scope.journey.mots.filter(note => !note.mot_solution)
  }

  $scope.OpenMOTsettings = (note) => {

    const launchModal = (note) => {
      var modalInstance = $uibModal.open({
        templateUrl: 'views/Workshops/Journey/_mot_template.html',
        backdrop: 'static',
        keyboard: false,
        resolve: {
          eventScope: function () { return $scope; }
        },
        controller: function ($scope, $uibModalInstance, eventScope) {
          $scope.eventScope = eventScope

          if(note) $scope.note = note

          $scope.save = () => {
            $rootScope.savingData = 'Saving MOT';

            console.log($scope.note)

            $http.put('/api/journey/note', {
              note: $scope.note,
              journey: $stateParams.id
            })
            .then(resp => {
              $uibModalInstance.close();
            })
            .catch(err => console.error(err))
            .finally(() => { $rootScope.savingData = false })
          }
          $scope.cancel = () => {
            $uibModalInstance.close();
          }
        }
      });
      modalInstance.result.then(data => {
        console.log(data)

        delete note.mot_description
        delete note.mot_lts
        delete note.mot_sts

      }, () => {});
    }

    if(note.component) {
      $http.get(`/api/journey/note/${note.uuid}`)
      .then(({ data }) => launchModal(data))
      .catch(error => console.error(error))
    }
    else launchModal(note)
  }


  $scope.CreateTemplate = (journey) => {
    console.log(journey)
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Workshops/Journey/_create_template.html',
      backdrop: 'static',
      keyboard: false,
      controller: function ($scope, $uibModalInstance) {
        let orders = {}
        let stageRelProps = {}

        $scope.template = {
          type: journey.workshop_type,
          voteLimit: journey.vote_limit_per_stage,
          author: $rootScope.Person.properties.uuid,
          stages: journey.stages.map(stage => {
            orders[stage.uuid] = stage.order;

            stageRelProps[stage.uuid] = {
              static_image_ref: stage.workshop_static_image_ref,
              static_text: stage.workshop_static_text
            }
            return stage.uuid
          }),
          personas: journey.personas.map(persona => {
            orders[persona.uuid] = persona.order
            return persona.uuid
          }),
          noteTypes: journey.interactions.map(interaction => {
            orders[interaction.uuid] = interaction.order
            return interaction.uuid
          })
        }

        let attributes = [
          'vote_limit_per_stage',
          'countown_minutes',
          'disable_leaderboard',
          'disable_live_updates',
          'high_contrast',
          'live_mode',
          'show_connections',
          'show_votes',
          'vote_limit_per_stage',
          'static_image_ref'
        ]
        attributes.forEach(a => $scope.template[a] = journey[a])

        $scope.template.orders = JSON.stringify(orders)
        $scope.template.stageRelProps = JSON.stringify(stageRelProps)

        $scope.create = () => {
          $scope.template.name = $scope.name;

          $http.post('/api/template', {
            template: $scope.template
          })
          .then(resp => {
            console.log(resp)
            $uibModalInstance.close();
          })
          .catch(err => console.error(err))
        }
        $scope.cancel = () => {
          $uibModalInstance.close();
        }
      }
    });
    modalInstance.result.then(data => {
      console.log(data)
    },
    () => {
      // $log.info('Modal dismissed at: ' + new Date());
    });
  }

  if($rootScope.currNote){
    $scope.searchFilter = $rootScope.currNote;
    delete $rootScope.currNote;
  }

  if (!$scope.journey.view_count) $scope.journey.view_count = 0;

  if ($rootScope.Person.role === 'external') {
    $scope.externalFilter = { external: true };
  }

  $scope.isBrainstormStage = (stage) => {
    return ($scope.journey.workshop_type === 'brainstorm' && stage.title.includes('_'))
  }

  // following code is added to get classname based on note progress value

  $scope.getImgName = function(progress){
    if(progress == 100){
      return "/build/images/green-cone-full.png";
    }else if(progress > 66){
      return "/build/images/red-cone-full.png";
    }else if(progress > 33){
      return "/build/images/red-cone-half.png";
    }else{
      return "/build/images/red-cone-one.png";
    }
  }

  $scope.goToProject = function(note){
    $state.go('dashboard.project', {'uuid':note.projectUUID});
  }

  $scope.getStats = () => {
    $http({
      method: 'GET',
      url: '/api/stats/leaderboard/' + $stateParams.id,
      params: {
        'nocache': new Date().getTime()
      }
    }).then(function (resp) {
      $scope.stats = resp.data;
    })
  }
  $scope.getVoteTable = () => {
    $http({
      method: 'GET',
      url: `/api/stats/voting/${$stateParams.id}/${$rootScope.Person.properties.uuid}`,
      params: {
        'nocache': new Date().getTime()
      }
    }).then(function (resp) {
      $scope.votingTable = resp.data;
    })
  }
  $scope.getStats()
  $scope.getVoteTable()

  $scope.matchVoteType = (puuid, personas, type) => {
    let persona = personas.find(p => p.uuid === puuid)

    if(persona) {
      return persona.votes.find(v => v.type === type) || { count: 0 }
    }
    else {
      return { count: 0 }
    }
  }

// Following function returns number of notes that we are currently showing on DOM after applying filters
  $scope.getCount = function(stageNotes){
    if(stageNotes && stageNotes.length){
      let filteredArray = [];
      stageNotes.forEach((note) => {
        if (note && ($scope.UnSelectedInteractions.indexOf(note.rels.interaction.uuid) < 0 && $scope.UnSelectedPersonas.indexOf(note.rels.persona.uuid) < 0) && !note.connection) {
          filteredArray.push(note);
        }
      })

        var sortArray = [];
        var orderedUUID = [];
        // This loop is to create array of objects from sorted object
        for(var key in $scope.journey.interaction_orders){
          var currObj = {
            key : key,
            value : $scope.journey.interaction_orders[key]
          }
          orderedUUID.push(currObj);
        }

        // This loop is to sort this newly created array of objects
        var newSortedArray = orderedUUID.sort(function(a, b){
          return a.value-b.value
      })

      // This loop is to make another array of strings(eg ['notes','new Notes'.....]) for sorting final stage.notes array
      newSortedArray.forEach((uuid) =>{
          $scope.journey.interactions.forEach((item) =>{
            if(item.uuid == uuid.key){
              sortArray.push(item.title);
              return;
            }
          })
        })

        var sortedArray = filteredArray.sort(function(a,b){
          return sortArray.indexOf(a.rels.interaction.title) - sortArray.indexOf(b.rels.interaction.title);
        })
       var filterSortArray = sortedArray.filter((arrayItem)=>{

        for(var i=0; i < newSortedArray.length;i++){
            if(arrayItem.rels.interaction.uuid == newSortedArray[i].key){
              return arrayItem;
            }
          }
        })

        // Sort the array and return it
        return filterSortArray;
      }

  }

  $scope.closeCommentBox = function(){
    $scope.FilterObj.isFilterChanged = true;
  }

  $scope.$on('closeMessage',function(){
    $scope.FilterObj.isFilterChanged = true;
  });

  $scope.getStageColor = function(stage) {
    if(!stage.workshop_sentiment_score) {
      return '#ddd';
    }
    else if(stage.workshop_sentiment_score < 6) {
      return 'red';
    }
    else if(stage.workshop_sentiment_score > 8) {
      return 'green';
    }
    else {
      return 'yellow';
    }
  }

  // following function is written to sort notes array(ie stage.notes) according to notes sorted in ($scope.journey.interaction_orders)
  // Here we get $scope.journey.interaction_orders as an object of sorted notes. If we apply for..in loop on this object, loop will traverse
  // all object keys after sorting keys alphabetically(this is default behaviour of chrome). So we have to use too many loops here and finally sort.
  // We have used reaturn and break statements so loops will not affect performance of application
  $scope.getFiltered = function (stageNotes) {
    // console.log(stageNotes)

    if (stageNotes) {
      var sortArray = [];
      var orderedUUID = [];
      // This loop is to create array of objects from sorted object
      for (var key in $scope.journey.interaction_orders) {
        var currObj = {
          key: key,
          value: $scope.journey.interaction_orders[key]
        }
        orderedUUID.push(currObj);
      }

      // This loop is to sort this newly created array of objects
      var newSortedArray = orderedUUID.sort(function (a, b) {
        return a.value - b.value
      })

      // This loop is to make another array of strings(eg ['notes','new Notes'.....]) for sorting final stage.notes array
      newSortedArray.forEach((uuid) => {
        $scope.journey.interactions.forEach((item) => {
          if (item.uuid == uuid.key) {
            sortArray.push(item.title);
            return;
          }
        })
      })
      stageNotes.forEach((note)=>{
          if(!note.rels.comments_count){
             note.rels.comments_count = 0
          }
          if(!note.rels.pains_count){
            note.rels.pains_count = 0
          }
          if(!note.rels.votes_count){
            note.rels.votes_count = 0
          }
      })
      var sortedArray = stageNotes.sort(function(a,b){
        return sortArray.indexOf(a.rels.interaction.title) - sortArray.indexOf(b.rels.interaction.title);
      })

      var sortByCraeated = sortedArray.sort(function(a,b){
        if(a.rels.interaction.title === b.rels.interaction.title){
          return a.created_at - b.created_at;
        }
      })

     var filterSortArray = sortByCraeated.filter((arrayItem)=>{

      for(var i=0; i < newSortedArray.length;i++){
          if(arrayItem.rels.interaction.uuid == newSortedArray[i].key){
            return arrayItem;
          }
        }
      })

      // Sort the array and return it
      return filterSortArray;
    }
  }

  // Subscribe to workshop data
  Pubnub.subscribe({
    channels: $scope.journey.stages.map(s => `${journey.uuid}_${s.uuid}`),
    withPresence: false,
    triggerEvents: ['message']
  });

  if($scope.isGroup) {
    Promise.all($scope.journey.journeys.map(j => {
      return $rootScope.fayeClient.subscribe(`/${j.uuid}`, data => handleEvents(data))
    }))
    .then(resp => {
      console.log('Listening for Server-Side Events on all journeys');
    });
  }
  else {
    $rootScope.fayeClient.subscribe(`/${$stateParams.id}`, data => {
      console.log($stateParams.id)
      handleEvents(data);
    })
    .then(() => {
      console.log($stateParams.id, 'Listening for Server-Side Events');
    });
  }

  $scope.journeyadmin = $scope.journey.admins.indexOf($rootScope.Person.properties.uuid) > -1;

  $scope.journey.kpis = ['renew', 'buy_more', 'easy', 'useful', 'recommended', 'enjoyable'];

  $scope.journey.voting = {};

  $scope.setStage = function (stage, firstOrClick) {
    if (firstOrClick) {
      var stageOnly = angular.copy(stage);
      delete stageOnly.notes;
      $scope.currentStage = stageOnly;
    }
  }

  $scope.journey.stages.map(function (stage, index) {
    if ($stateParams.stage) {
      if (stage.uuid == $stateParams.stage) {
        stageOnly = angular.copy(stage);
        delete stageOnly.notes;
        $scope.currentStage = stageOnly;
        $scope.setStage($scope.currentStage, true)
      }
    }
    $scope.journey.voting[stage.uuid] = {
      personas: {},
      interactions: {}
    }
    $scope.journey.personas.forEach(function (persona) {
      $scope.journey.voting[stage.uuid].personas[persona.uuid] = { interactions: {} }
      $scope.journey.interactions.forEach(function (interaction) {
        $scope.journey.voting[stage.uuid].personas[persona.uuid].interactions[interaction.uuid] = { vote: [], pain: [] }
      })
    })

    stage.index = index;
    if ($stateParams.tab) {
      if (stage.uuid == $stateParams.tab) {
        setTimeout(() => {
          var elems = document.querySelector("#journey_tabs .active");
          if(elems !==null){
           elems.classList.remove("active");
          }
          let addActivetab = document.getElementById($stateParams.tab);
          addActivetab.classList.add("active");

          var elemsContent = document.querySelector(".tab-content .active");
          if(elemsContent !==null){
           elemsContent.classList.remove("active");
          }
          var tabContent = document.getElementById(`tab-${$stateParams.tab}`)
          tabContent.classList.add('active');
        }, 300);

        // stageOnly = angular.copy(stage);
        // delete stageOnly.notes;
        // $scope.currentStage = stageOnly;
        // $scope.setStage($scope.currentStage, true)
      }
    }
    return;
  })

  $scope.editJourneyStageDescription = function (stage, journey) {
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Workshops/Journey/_edit_journey_stage_description.html',
      backdrop: 'static',
      controller: function ($scope, $uibModalInstance) {
        $scope.wsd = (stage.workshop_description || stage.description);
        $scope.wsi = (stage.workshop_static_image_ref || '')
        $scope.wst = (stage.workshop_static_text || '')
        $scope.wss = stage.workshop_sentiment_score
        $scope.ws_whiteboard = stage.workshop_whiteboard || false

        $scope.close = function () {
          $uibModalInstance.close(null)
        }
        $scope.default = function () {
          $scope.wsd = stage.description
        }
        $scope.save = function () {
          $http.post('/api/stage/set_workshop_stage_details', {
            stage: stage.uuid,
            journey: journey,
            description: $scope.wsd,
            score: $scope.wss,
            image: $scope.wsi,
            text: $scope.wst,
            whiteboard: $scope.ws_whiteboard
          }).then(function (resp) {
            $uibModalInstance.close($scope.wsd);
          }).catch(function (err) {
            console.log(err);
          })
        }
      },
      keyboard: false
    });
    modalInstance.result.then(function (data) {
      $scope.currentStage.workshop_description = data;
    }, function () {
      // $log.info('Modal dismissed at: ' + new Date());
    });
  }

  $scope.loadStageData = (limit) => {
    $filter('orderBy')($scope.journey.stages, 'order').map(function (stage) {
      stage.limits = {
        vote: {
          interactions: [],
          personas: []
        }, pain: {
          interactions: [],
          personas: []
        }
      };
      let params = {
        'interaction_orders': $scope.journey.interaction_orders,
        'nocache': new Date().getTime(),
        'limit': limit,
      }
      if($scope.isGroup) params.group = true;

      $http({
        method: 'GET',
        url: `/api/journey/${$stateParams.id}/stage/${stage.uuid}`,
        params: params

      }).then(function (resp) {
        stage.notes = resp.data;

        $scope.allNotes.push(stage.notes)

        $scope.journey.mots = $scope.journey.mots.concat(stage.notes.filter(note => note.mot))
        // console.log('STAGE LAODED', stage)
        return stage;
      })
    })
  }


  $scope.sortedCount = function (note) {
    if($scope.noteCardOrder == "-gap"){
      let gap = 0;
      gap = note.average_effectiveness - note.average_importance;
      note.gap =  Math.round(gap*100)/100;
    }
    if ($scope.noteCardOrder !== 'rels.interaction.order') {
      return $scope.noteCardOrder
        .replace('-', '')
        .split('.')
        .reduce(function (a, b) {
          return a[b]
        }, note) || 0;
    }
  }
  let liveMode = $scope.journey.live_mode || false;
  if(!liveMode){
    $scope.loadStageData(true)
  }
  else {
    $scope.loadStageData(false)
  }

  $scope.convertValToObj = function (value) {
    if (isNaN(value)) {
      return value
    } else {
      return { value: value }
    }
  }

  $scope.deleteComment = function (note, comment) {
    $http({
      method: 'DELETE',
      url: '/api/journey/note/' + note.uuid + '/comment/' + comment.uuid,
      headers: { 'journey': $stateParams.id }
    }).then(function(resp) {
      console.log(resp);
      note.rels.comments_count -= 1;
    })
      .catch(function (err) {
        console.error(err)
      })
  }

  $scope.updateComment = function (note, comment) {
    console.log(comment)
    $http({
      method: 'POST',
      url: '/api/journey/note/' + note.uuid + '/comment/' + comment.uuid,
      headers: { 'journey': $stateParams.id },
      data: { comment: comment.comment }
    }).then(function(resp) {
      console.log('the response', resp);
    })
    .catch(function (err) {
      console.error('the error', err)
    })
  }

  // MERGE NOTES
  $scope.merge_into_note = function (note) {
    $scope.mergeMode = true;
    $scope.mergeObject = {
      primary: note.uuid,
      others: [],
      votes: {},
      comments: {},
      merger: $rootScope.Person.properties.uuid
    }
    $scope.mergeObject.votes[note.uuid] = {
      votes_count: note.rels.votes_count,
      pains_count: note.rels.pains_count
    }
  }

  $scope.select_for_merge = function (note) {
    debugger;
    if(!note.isMilestoneLinked){
      var idx = $scope.mergeObject.others.indexOf(note.uuid)
      if (idx > -1) {
        $scope.mergeObject.others.splice(idx, 1);
      } else {
        $scope.mergeObject.others.push(note.uuid)
        $scope.mergeObject.votes[note.uuid] = {
          votes_count: note.rels.votes_count,
          pains_count: note.rels.pains_count
        }
        $scope.mergeObject.comments[note.uuid] = note.rels.comments;
      }
      $scope.mergeObject.connection = note.connection

      let newComments = ($scope.newComments[note.uuid] || [])

      $scope.mergeObject.comments[note.uuid] = (note.rels.comments || []).concat(newComments);
    }else{
      alert('You can not select this note as this is a task in project - '+note.projectName);
    }
  }

  $scope.switch_primary_for_merge = function (note) {
    $scope.mergeObject.others.push($scope.mergeObject.primary)
    var idx = $scope.mergeObject.others.indexOf(note.uuid)
    if (idx > -1) {
      $scope.mergeObject.others.splice(idx, 1);
    }
    $scope.mergeObject.primary = note.uuid;

    $scope.mergeObject.connection = note.connection
  }

  $scope.cancel_merge = function () {
    $scope.mergeMode = false;
    $scope.mergeObject = {};
  }

  $scope.finish_merge = function () {
    $scope.mergingNotes = 'Merging Notes';

    const merge = () => {
      return $http.post(`/api/journey/mergeNotes${$scope.mergeObject.connection ? '?connection=true' : ''}`, {
        interaction_orders: $scope.journey.interaction_orders,
        notes: $scope.mergeObject,
        journey: $stateParams.id
      })
      .then(resp => console.log(resp.data))
      .catch(err => console.log(err))
      .finally(() => {
        $scope.mergingNotes = false;
        $scope.cancel_merge();
      })
    }

    const votes = []

    if($scope.journey.merge_plus_one) {
      Object.keys($scope.mergeObject.votes).forEach(key => {
        let count = $scope.mergeObject.votes[key].votes_count

        if(count < 1) {
          votes.push($http({
            method: 'POST',
            url: '/api/journey/note/vote',
            headers: { 'journey': $stateParams.id },
            data: { uuid: key, str: 'vote', direction: 'up', nobroadcast: true }
          }))
        }
      })
      Promise.all(votes)
      .then(() => merge())
      .catch(error => console.log('vote error', error))
    }
    else {
      merge()
    }
  }
  // END MERGE NOTES


  // CONNECT NOTE COMPONENTS
  $scope.select_for_connect = function (note) {
    if( $scope.connections.connection !== note.uuid ) {
      let arr = ( note.connection ? 'connections' : 'notes' )

      let idx = $scope.connections[arr].indexOf(note.uuid)

      if (idx > -1) {
        $scope.connections[arr].splice(idx, 1);
      } else {
        $scope.connections[arr].push(note.uuid)
      }
    }
  }

  $scope.connect_note_component = function( note ) {
    $scope.connectMode = true;

    $scope.toggle_view_connections( note.uuid )
  }

  $scope.reset_connections = function( note ) {
    console.log('reset', note)
      $http.post('/api/journey/resetConnections', {
        connection: note.uuid,
        journey: $stateParams.id,
        label: note.labels[0]
      })
      .then(resp => {
      })
      .catch(err => {
        console.log(err)
      })
  }

  $rootScope.$on('deleteConnection', function(e, note) {
    $scope.reset_connections( note )
  })

  $scope.cancel_connect = function() {
    $scope.connectMode = false;
    $scope.reset_connection_view()
  }

  $scope.finish_connect = function() {
    // console.log($scope.connections)
    $http.post('/api/journey/connectNotes', $scope.connections)
    .then(function (resp) {
      console.log(resp)
      $scope.cancel_connect()
    })
    .catch(function (err) {
      console.log(err)
    })
  }

  $scope.toggle_view_connections = function( noteUuid ) {
    $scope.showConnections = !$scope.showConnections

    if( $scope.connectMode || $scope.showConnections ) {
      $http.post('/api/journey/getConnections', { note: noteUuid })
      .then(function(resp) {
        console.log(resp.data)
        $scope.connections = resp.data;

        $scope.connections.connections = []
        $scope.connections.connecter = $rootScope.Person.properties.uuid
        $scope.connections.journey = $stateParams.id;

        $scope.connectionsState = angular.copy($scope.connections)

        $scope.readyForConnect = true;
      })
      .catch(function(err) {
        console.log(err)
      })
    }
    else {
      $scope.connections = $scope.connectionsState
    }
  }

  $scope.toggle_view_mots = function( noteUuid ) {
    $scope.showMotConnections = !$scope.showMotConnections

    if( $scope.showMotConnections ) {
      $http.post('/api/journey/getMotConnections', { note: noteUuid })
      .then(function(resp) {
        $scope.mot_connections = resp.data;

        console.log($scope.mot_connections)
      })
      .catch(function(err) {
        console.log(err)
      })
    }
  }

  $scope.get_connection_note = () => {
    if( $scope.showConnections && $scope.connections.connection ) {

    }
  }

  $scope.reset_connection_view = function() {
    $scope.showConnections = false
    $scope.connections = $scope.connectionsState
  }
  // END CONNECT NOTE COMPONENTS


  // TODO remove this after migration
  $scope.clearAllVotes = function () {
    $http.post('/api/journey/' + $stateParams.id + '/clearallvotes')
      .then(function (resp) {
        console.log(resp)
        $state.reload()
      })
  }

  $scope.firstInt = function (first, int) {
    if (first) {
      $scope.defaultInteraction = int;
    }
  }
  $scope.firstPersona = function (first, persona) {
    if (first) {
      $scope.defaultPersona = persona;
    }
  }

  $scope.personaFilter = $scope.journey.personas
  // $scope.personaFilter.unshift({
  //   title: 'All Personas', uuid: null, system: true
  // })

  // console.log($scope.journey.stages)
  $scope.setOrder = function () {
    $scope.noteCardOrder = 'rels.interaction.order'
  }

  $scope.toggleFilterButtons = function (arg, holder) {
    if ($scope[holder].length === arg.length) {
      $scope[holder] = [];
    }
    else {
      $scope[holder] = arg.map(function (i) { return i.uuid })
    }
  }

  // Detect unselected interaction
  $scope.toggleInteraction = function (int) {
    var arr = $scope.UnSelectedInteractions;
    var idx = arr.indexOf(int.uuid);
    idx > -1 ? arr.splice(idx, 1) : arr.push(int.uuid);
    $scope.UnSelectedInteractions = arr;
  }

  $scope.togglePersona = function (pers) {
    var arr = $scope.UnSelectedPersonas;
    var idx = arr.indexOf(pers.uuid)
    idx > -1 ? arr.splice(idx, 1) : arr.push(pers.uuid);
    $scope.UnSelectedPersonas = arr;
  };

  $scope.togglePositions = function() {
    $scope.showPositions = !$scope.showPositions
  }

  // VOTING
  $scope.toggleJourneyVotes = function () {
    $scope.journey.show_votes = !$scope.journey.show_votes;

    $http.put('/api/journey/toggleVotes', {
      uuid: $scope.journey.uuid,
      show_votes: $scope.journey.show_votes
    }).then(function (resp) {
      // console.log(resp)
    }).catch(function (err) {
      console.log(err)
    })
  }

  $scope.initializeLimits = function (note, stage_uuid) {
    if (!note.static && !note.connection) {
      ['vote', 'pain'].forEach(function (str) {
        if (note.rels['user_' + str]) {
          $scope.journey.voting[stage_uuid].personas[note.rels.persona.uuid].interactions[note.rels.interaction.uuid][str].push(note.uuid);
        }
      });
    }
  }

  $scope.calculateLimits = function (str, note, stage_uuid) {
    if (note.rels['user_' + str]) {
      $scope.journey.voting[stage_uuid].personas[note.rels.persona.uuid].interactions[note.rels.interaction.uuid][str].push(note.uuid)
    } else {
      var idx1 = $scope.journey.voting[stage_uuid].personas[note.rels.persona.uuid].interactions[note.rels.interaction.uuid][str].indexOf(note.rels.interaction.uuid);
      $scope.journey.voting[stage_uuid].personas[note.rels.persona.uuid].interactions[note.rels.interaction.uuid][str].splice(idx1, 1);
    }
  }

  $scope.checkVoteLimits = function (str, note, stage_uuid) {
    $scope.journey.vote_limit_per_stage = $scope.journey.vote_limit_per_stage || 3
    if( note.connection ) {
      return true
    }
    else {
      var count = $scope.journey.voting[stage_uuid].personas[note.rels.persona.uuid].interactions[note.rels.interaction.uuid][str].length
      if (count < $scope.journey.vote_limit_per_stage) {
        return true;
      } else {
        $scope.friendlyerror = `You may not vote on more than ${$scope.journey.vote_limit_per_stage} notes of the same stage, interaction, and persona`;
        return false;
      }
    }
  }
  $scope.vote = function (str, note, stage_uuid, event) {
    if ($scope.journeyadmin && event.shiftKey) {
      castVote(str, note, stage_uuid, 'up', false)
    } else if ($scope.journeyadmin && event.altKey) {
      castVote(str, note, stage_uuid, 'down', false)
    } else {
      if(note.rels['user_'+str]){
        castVote(str, note, stage_uuid, 'down', true);
      } else if($scope.checkVoteLimits(str, note, stage_uuid)) {
        castVote(str, note, stage_uuid, 'up', true);
      }
    }
  }

  function castVote(str, note, stage_uuid, direction, toggle) {
    $scope.friendlyerror = '';
    if(toggle) {
      note.rels['user_'+str] = !note.rels['user_'+str]
      if(note.rels['user_'+str]) {
        //note.rels[str+'s_count'] += 1;
        if(str === "vote"){
          note.rels.votes_count += 1;
        }else if(str === "pain"){
          note.rels.pains_count += 1;
        }
      } else {
        // note.rels[str+'s_count'] -= 1;
        if(str === "vote"){
          note.rels.votes_count -= 1;
        }else if(str === "pain"){
          note.rels.pains_count -= 1;
        }
      }
    }
    if( !note.connection ) $scope.calculateLimits(str, note, stage_uuid)
    $http({
      method: 'POST',
      url: '/api/journey/note/vote',
      headers: { 'journey': $stateParams.id },
      data: { uuid: note.uuid, str: str, direction: direction }
    })
      .then(function (resp) {
        if (!toggle) {
          note.rels['user_' + str] = (resp.data.count > 0 ? true : false);
          note.rels[str + 's_count'] = resp.data.count;
        }
      }).catch(function (err) {
        console.error(err);
      })
  }

  $scope.toggleComments = function (note_id) {
    $(note_id + ' input').focus()
  }

  $scope.updateNote = function (note) {
    note.rels.stage = $scope.currentStage;
    JourneyWorkshopAPI.UpdateNote({ note: note })
  }


  $scope.newCommentRank = 0;

  $scope.rankComment = function (rank) {
    if ($scope.newCommentRank === 1 && rank === 1) {
      $scope.newCommentRank = 0;
    }
    else {
      $scope.newCommentRank = rank
    }
  }

  $scope.postComment = function (note, newComment, newCommentRank, voc, task) {
    if (newComment.length == 0) return;
    var rel = {
      from_id: $rootScope.Person.properties.uuid,
      to_id: note.uuid,
      type: "comment",
      properties: {
        comment: newComment,
        voc: (voc ? true : false),
        task: (task ? true : false),
        rank: newCommentRank,
        uuid: uuidv4()
      }
    };
    JourneyWorkshopAPI.PostComment(rel).then((data) => {
      console.log(data)
      if(!$scope.newComments[note.uuid]) $scope.newComments[note.uuid] = [];
      let newCommentObj = {
        created_at: new Date().getTime(),
        comment: newComment,
        rank: newCommentRank,
        voc: (voc ? true : false),
        task: (task ? true : false),
        uuid: rel.properties.uuid,
        author: {
          image_url: $rootScope.Person.properties.image_url,
          firstname: $rootScope.Person.properties.firstname,
          uuid: $rootScope.Person.properties.uuid
        }
      }
      note.rels.comments_count += 1;
      $scope.newComments[note.uuid].push(newCommentObj);
      $('#note_'+data.note+' .contact-stat.comments strong').html(note.rels.comments_count);
      $scope.newComment = '';
      $scope.newCommentRank = 0;
      note.rels.commenter = true;
    });
  }

  $scope.missingComponents = function () {
    return (
      $scope.journey.stages.length === 0 ||
      $scope.journey.interactions.length === 0 ||
      $scope.journey.personas.length === 0
    )
  }


  $scope.open_note_creator = function () {
    $rootScope.isConnectionOpen = false;
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Workshops/Journey/create_note.html',
      controller: JourneyNoteCreatorCtrl,
      backdrop: 'static',
      keyboard: false,
      resolve: {
        eventScope: function () {
          return $scope;
        }
      }
    });
  };

  $scope.open_connection_creator = function () {
    $rootScope.isConnectionOpen = true;
    var modalInstance = $uibModal.open({
      // templateUrl: 'views/Dashboard/Projects/milestone_components.html',
      templateUrl: 'views/Workshops/Journey/_connection_components.html',
      controller: JourneyNoteConnectionsCtrl,
      backdrop: 'static',
      keyboard: false,
      resolve: {
        eventScope: function () {
          return $scope;
        }
      }
    });
  };

  $scope.safeGet = function (nestedObj, pathArr) {
    return pathArr.reduce((obj, key) => {
      return (obj && obj[key] !== 'undefined') ? obj[key] : undefined
    }, nestedObj);
  };

  $scope.average = function (array) {
    var filtered = array.filter(x => x !== undefined);
    var sum = filtered.reduce((acc, curr) => acc + curr, 0);
    return (sum / array.length).toFixed(2);
  };

  $scope.copyComponent = function () {

    $scope.sorted_types = [{
      "label": "Stage",
      "type": "journey_stages"
    }, {
      "label": "Interaction",
      "type": "journey_interactions"
    }]
    var result1 = [];

    $scope.Getting = true;
    $scope.Getting = true;

    JourneyAPI.GetJourneyConnections(journey.uuid).then(function (result) {
      $scope.Getting = false;
      $scope.initial_journey_connections = JSON.parse(JSON.stringify(result));
      $scope.journey_connections = result;

      $scope.sorted_types.forEach((it) => {
        if ($scope.journey_connections.node_label_index[it.label]) {
          $scope.journey_connections.node_label_index[it.label].sort((a, b) => {
            if (!$scope.journey_connections.incoming[it.type] || !$scope.journey_connections.incoming[it.type][a] || !$scope.journey_connections.incoming[it.type][b]) return 0;
            let rel_id_a = $scope.journey_connections.incoming[it.type][a][0];
            let rel_id_b = $scope.journey_connections.incoming[it.type][b][0];
            let rel_a = $scope.journey_connections.rels[rel_id_a];
            let rel_b = $scope.journey_connections.rels[rel_id_b];
            return rel_a.properties.order - rel_b.properties.order;
          })
        }
      });
      result.node_label_index.Stage.forEach(function (key) {
        $scope.journey.stages.filter(function (item) {
          if (item.uuid == key) {
            result1.push(item);
          }
        })
      })
      $scope.newjourney = $scope.journey;
      $scope.newjourney.stages = result1;

    })
  };

  // $scope.copyComponent();

  //Launches the edit note overlay
  $scope.open_edit_note = function (note, position) {
    createModalInstance()

    function createModalInstance() {
      var modalInstance = $uibModal.open({
        templateUrl: 'views/Workshops/Journey/edit_note.html',
        controller: JourneyNoteEditorCtrl,
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        resolve: {
          eventScope: function () {
            return $scope;
          },
          uuid: function () {
            return null;
          },
          note: function () {
            return note;
          }
        }
      });
    }

  }

  function handleEvents(dataObj) {
    if (!dataObj) return;
    var data;
    Object.keys(dataObj).forEach(function (action) {
      Activity.log($scope.journey.uuid, action, 'last_active_at');
      data = dataObj[action];

      if($scope.journey.disable_live_updates || $scope.mute_updates) {
        if(['post.note'].includes(action)) {
          if(data.rels.author.uuid !== $rootScope.Person.properties.uuid) {
            return
          }
        }
      }
      $scope.getStats()

      switch (action) {
        case 'workshop.countdown':
          $scope.stopwatchAction = data
          break;

        case 'post.note':
          if($scope.journey.stages.length){
            var stageIdx = $scope.journey.stages.map(function(e) { return e.uuid; }).indexOf(data.rels.stage.uuid)
            data.rels.interaction.order = $scope.journey.interaction_orders[data.rels.interaction.uuid];
            if(stageIdx > -1){
              $scope.journey.stages[stageIdx].notes.push(data);
            }
          }
          break;

        case 'post.connection':
          $scope.journeyConnections.push(data)
          break;

        case 'note.votes':
          $('#note_' + data.note + ' .contact-stat.votes .vote-count').html(data.count);

          $scope.getVoteTable()
          break;

        case 'note.pains':
          $('#note_' + data.note + ' .contact-stat.pains .vote-count').html(data.count);

          $scope.getVoteTable()
          break;

        case 'note.show_votes':
          $scope.journey.show_votes = data;
          break;

        case 'post.comment':
          if (!$scope.newComments[data.note]) $scope.newComments[data.note] = [];
          if (data.author.uuid != $rootScope.Person.properties.uuid) {
            $scope.newComments[data.note].push(data)
          }
          $('#note_' + data.note + ' .contact-stat.comments .comment-count').html(data.count);
          break;

        case 'update.comment':
          $(`#comment_${data.comment} .comment-text`).text(data.commentText);
          break;

        case 'delete.comment':
          $('#comment_' + data.comment).remove();
          $('#note_' + data.note + ' .contact-stat.comments .comment-count').html(data.count);
          break;

        case 'update.note':
          updateNote(data);
          break;

        case 'delete.note':
          if( data.connection ) {
            $scope.notesIdx = $scope.journeyConnections.map(function (e) { return e.uuid; }).indexOf(data.uuid)
            if( $scope.notesIdx > -1 ) {
              $scope.journeyConnections.splice($scope.notesIdx, 1)
            }
          }
          else {
            $scope.stageIdx = $scope.journey.stages.map(function (e) { return e.uuid; }).indexOf(data.stage)
            $scope.notesIdx = $scope.journey.stages[$scope.stageIdx].notes.map(function (e) { return e.uuid; }).indexOf(data.uuid)

            if( $scope.notesIdx > -1 ) {
              $scope.journey.stages[$scope.stageIdx].notes.splice($scope.notesIdx, 1)
            }
          }
          break;

        case 'note.connect':
          $('#component_' + data.connection + ' .connections-count').html(data.notes.length + data.connections.length);
          break;

        case 'note.merge':
          let notesIdx;
          // $scope.mergingNotes = 'Merging Notes'
          if( data.connections ) {
            data.others.forEach(noteUuid => {
              notesIdx = $scope.journeyConnections.findIndex(note => note.uuid === noteUuid)
              if (notesIdx > -1) {
                $scope.journeyConnections.splice(notesIdx, 1)
              }
            })
          }
          else {
            data.others.forEach(noteUuid => {
              $scope.journey.stages.forEach(stage => {
                notesIdx = stage.notes.findIndex(note => note.uuid === noteUuid)
                if (notesIdx > -1) {
                  stage.notes.splice(notesIdx, 1)
                }
              })
            })
            updateNote(data.primary, () => {
              // console.log('done updating note')
            })
          }
          $scope.mergingNotes = false;
          break;

        case 'stage.workshop_details':
          $scope.journey.stages.map(function (stage) {
            if (stage.uuid === data.stage_uuid) {
              stage.workshop_description = data.description
              stage.workshop_static_image_ref = data.static_image_ref
              stage.workshop_static_text = data.static_text
              stage.workshop_sentiment_score = data.score
              stage.workshop_whiteboard = data.whiteboard

              console.log('THIS', data.whiteboard, stage.workshop_whiteboard)
            };
            return;
          })
          break;

        case 'workshop.stats':
        console.log(data)
          $scope.stats = data
          break;

        default:
          console.log('Action "' + action + '" is not defined');
      }

      function updateNote(obj, callback) {
        var stageIdx = $scope.journey.stages.findIndex(stage => stage.uuid === obj.rels.stage.uuid)

        if($scope.journey.stages[stageIdx]) {
          var notesIdx = $scope.journey.stages[stageIdx].notes.findIndex(note => note.uuid === obj.uuid)
          if (obj.rels.old_stage) {
            var oldStageIdx = $scope.journey.stages.findIndex(stage => stage.uuid === obj.rels.old_stage)
            var oldNotesIdx = $scope.journey.stages[oldStageIdx].notes.findIndex(note => note.uuid === obj.uuid)
            if( oldNotesIdx > -1 ) {
              $scope.journey.stages[oldStageIdx].notes.splice(oldNotesIdx, 1);
            }
            $scope.journey.stages[stageIdx].notes.unshift(obj)

            if(callback) callback('done')
          } else {
            if( notesIdx > -1 ) {
              $scope.journey.stages[stageIdx].notes.splice(notesIdx, 1, obj)
            }

            if(callback) callback('done')
          }
        }

        if(callback) callback('did nothing')
      }

      $scope.$apply();

    })
  }

  $scope.$on('$viewContentLoaded', function (event) {
    $timeout(function () {
      $rootScope.loadingJourney = false;
    }, 700)
  });


  $scope.sortOptions = SortProperties

  $scope.$on('updateConnectons',function(){
      $scope.journey.stages.forEach(function(stage){
          if(stage.uuid == $scope.currentStage.uuid){
            $rootScope.connectionNotes.push(stage.notes[stage.notes.length-1]);
            return;
          }
        })
  })

  Activity.log($scope.journey.uuid, 'View Workshop', 'last_active_at', $scope.journey.view_count);
})


function JourneyNoteCreatorCtrl(Activity, $scope, $rootScope, $uibModalInstance, eventScope, sweetAlert, GraphJS, JourneyWorkshopAPI) {

  // For journey groups
  if(eventScope.journey.journeys && eventScope.journey.journeys.length > 0) {
    eventScope.SelectedJourney = eventScope.journey.journeys[0];

    $scope.$watch('eventScope.SelectedJourneyUuid', function() {
      $scope.eventScope.SelectedJourney = eventScope.journey.journeys.find(j => {
        return j.uuid === $scope.eventScope.SelectedJourneyUuid
      })

      eventScope.SelectedInteraction = eventScope.SelectedJourney.interactions[0];
      eventScope.SelectedPersona = [eventScope.SelectedJourney.personas[0].uuid];
      eventScope.SelectedStage = [eventScope.SelectedJourney.stages[0].uuid];
    });
  }
  else {
    eventScope.SelectedJourney = eventScope.journey;
    eventScope.SelectedInteraction = eventScope.defaultInteraction;
    eventScope.SelectedPersona = [eventScope.defaultPersona.uuid];
    eventScope.SelectedStage = [eventScope.currentStage.uuid];
  }

  eventScope.SelectedJourneyUuid = eventScope.SelectedJourney.uuid;

  $scope.eventScope = eventScope;
  $scope.note = {
    title: "",
    image_url: "",
    description: "",
    external_url: ""
  };

  $scope.note.external = ($rootScope.Person.role === 'external' ? true : false);

  $scope.toggleMultiselect = function (selectedComponent, uuid) {
    var idx = eventScope[selectedComponent].indexOf(uuid);
    if (idx > -1) {
      eventScope[selectedComponent].splice(idx, 1)
    } else {
      if(!$scope.isMultiselect){
        eventScope[selectedComponent][0] = uuid;
      }else{
        eventScope[selectedComponent].push(uuid);
      }
    }
  }

  $scope.preventTyping = function (event, text, charLimit) {
    if (text) {
      if (text.length >= charLimit) {
        if (event.keyCode != 8) event.preventDefault();
      }
    }
  }

  $scope.$on('deleteConnection', function(event , note){
    console.log('this one?')
    JourneyWorkshopAPI.DeleteNote(note.uuid, eventScope.currentStage.uuid);
  })

  $scope.cancel = function () {
    $uibModalInstance.close();
  }
  $scope.submit = function (closeModal) {
    if($rootScope.isConnectionOpen){
      $uibModalInstance.close();
      return
    }
      var post_data = {
        note: $scope.note,
        journey_id: eventScope.SelectedJourneyUuid,
        stage_ids: eventScope.SelectedStage,
        persona_ids: eventScope.SelectedPersona,
        interaction_id: eventScope.SelectedInteraction.uuid,
        author_id: $rootScope.Person.properties.uuid
      };

    // console.log(post_data)
    JourneyWorkshopAPI.PostNote(post_data).then((resp) => {
      Object.keys($scope.note).forEach(function (key) {
        $scope.note[key] = '';
      })
      // $scope.note = {};
      if (closeModal) {
        $uibModalInstance.close();
      }
      Activity.log($scope.eventScope.journey.uuid, 'updated note', 'last_active_at');
    }).catch(function (err) {
      console.log(err);
    });
  }
};


function JourneyNoteConnectionsCtrl(Activity, $scope, $rootScope, $uibModalInstance, eventScope, sweetAlert, GraphJS, JourneyWorkshopAPI) {
  $scope.eventScope = eventScope;
  $scope.note = {};

  $scope.note.external = ($rootScope.Person.role === 'external' ? true : false);

  $scope.toggleMultiselect = function (selectedComponent, uuid) {
    var idx = eventScope[selectedComponent].indexOf(uuid);
    if (idx > -1) {
      eventScope[selectedComponent].splice(idx, 1)
    } else {
      eventScope[selectedComponent].push(uuid)
    }

    console.log(eventScope[selectedComponent])
  }

  $scope.preventTyping = function (event, text, charLimit) {
    if (text) {
      if (text.length >= charLimit) {
        if (event.keyCode != 8) event.preventDefault();
      }
    }
  }

  $scope.cancel = function () {
    $uibModalInstance.close();
  }
  $scope.submit = function (closeModal) {
    if($rootScope.isConnectionOpen){
      $uibModalInstance.close();
      return
    }
      var post_data = {
        note: $scope.note,
        journey_id: eventScope.journey.uuid,
        author_id: $rootScope.Person.properties.uuid
      };

    // console.log(post_data)
    JourneyWorkshopAPI.PostNote(post_data).then((resp) => {
      Object.keys($scope.note).forEach(function (key) {
        $scope.note[key] = '';
      })
      // $scope.note = {};
      if (closeModal) {
        $uibModalInstance.close();
      }
      Activity.log($scope.eventScope.journey.uuid, 'updated note', 'last_active_at');
    }).catch(function (err) {
      console.log(err);
    });
  }
};



app.controller('workshopHeaderCtrl', function ($stateParams, $uibModal, $scope) {
  $scope.PopConnectModal = function () {
    PopJourneyConnectModal($stateParams.id, $uibModal);
  }
})


// FINDER: EDIT NOTE

function JourneyNoteEditorCtrl(Activity, Kpis, $scope, $rootScope, $state, sweetAlert, Alert, GraphJS, JourneyWorkshopAPI, $uibModalInstance, eventScope, uuid, note) {
  $scope.eventScope = eventScope;
  $scope.note = note;
  $scope.note.rels.stage = eventScope.currentStage;
  $scope.note.rels.old_stage = eventScope.currentStage.uuid;
  $scope.kpis = [];

  Kpis.journey($scope.eventScope.journey.uuid).then(function (kpis) {
    $scope.kpis = kpis;
  })

  $scope.setMotRadio = (note) => {
    if(note.mot) {
      note.mot_type = '1'
    }
    else if(note.mot_solution) {
      note.mot_type = '2'
    }
    else {
      note.mot_type = '3'
    }
  }

  $scope.setKpi = function (property, kpi) {
    console.log(kpi.uuid)
    $scope.note[property] = kpi.uuid;
  }

  var letters = ['a', 'b', 'c', 'd', 'e', 'f']
  letters.forEach(function (letter) {
    if ($scope.eventScope.journey['correlation_' + letter] && typeof ($scope.eventScope.journey['correlation_' + letter]) === 'string') {
      $scope.eventScope.journey['correlation_' + letter] = JSON.parse($scope.eventScope.journey['correlation_' + letter])
    }
  })

  $scope.eventScope.journey.kpis.forEach(function (kpi) {
    if ($scope.eventScope.journey[kpi] && typeof ($scope.eventScope.journey[kpi]) === 'string') {
      $scope.eventScope.journey[kpi] = JSON.parse($scope.eventScope.journey[kpi])
    }
  })

  $scope.formatKpi = function (kpi) {
    return kpi.replace('_', ' ');
  }

  $scope.preventTyping = function (event, text, charLimit) {
    if (text) {
      if (text.length >= charLimit) {
        if (event.keyCode != 8) event.preventDefault();
      }
    }
  }

  $scope.calculateGap = function () {
    if ($scope.eventScope.journey.desired_score) {
      if ($scope.note.average_importance) {
        $scope.note.gap_a = parseFloat(($scope.note.average_importance - $scope.eventScope.journey.desired_score).toFixed(2));
      }
      if ($scope.note.average_effectiveness) {
        $scope.note.gap_b = parseFloat(($scope.note.average_effectiveness - $scope.eventScope.journey.desired_score).toFixed(2));
      }
    }
    if ($scope.note.average_importance && $scope.note.average_effectiveness) {
      $scope.note.gap_c = parseFloat(($scope.note.average_effectiveness - $scope.note.average_importance).toFixed(2));
    }
  }
  $scope.calculateGap();

  $scope.PopDeleteAlert = function (uuid) {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover this Note!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!"
    },
      function () {
        JourneyWorkshopAPI.DeleteNote(uuid, $scope.note.rels.stage.uuid);
        $uibModalInstance.close();
      });
  }
  $scope.cancel = function () {
    $uibModalInstance.close();
  }

  $scope.submit = function (note) {
    $rootScope.savingData = 'Saving Note';

    JourneyWorkshopAPI.UpdateNote({note: note})
    .then(function(resp) {
      $rootScope.savingData = false;
      //$state.reload();
      $rootScope.$broadcast('closeMessage');
      sweetAlert.swal({
        title: "Success!",
        text: "Your Note will be updated",
        type: "success",
      }, function (isConfirm) {
        $uibModalInstance.close();
      });
    })
  }
};
