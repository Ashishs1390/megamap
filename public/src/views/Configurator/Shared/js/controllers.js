
function createNodeCtrl($scope, $state, notify, $rootScope, sweetAlert, $uibModalInstance, SharedAPI, label, dynamicFields, workshopType, onSuccess) {
  console.log(label)
    if(dynamicFields) $scope.dynamicFields = dynamicFields;
    if(workshopType) $scope.workshopType = workshopType;

    $scope.autoDescription = true;
    $scope.updateDescriptionText = function(change) {
      if(change) {
        $scope.revised_node.properties.description = $scope.revised_node.properties.title;
      }
    }

    var newComponentTitle = localStorage.getItem('newComponentTitle') ? localStorage.getItem('newComponentTitle') : '';

    $scope.updateDescription = function(){
      console.log($scope.revised_node.properties.title)
      if(!$scope.descGotFocus){
        $scope.revised_node.properties.description =$scope.revised_node.properties.title;
      }
    }
    $scope.descOnFocus = function(){
      $scope.descGotFocus = true;
    }
    $scope.label = label.charAt(0).toUpperCase() + label.slice(1);
    $scope.labels = [$scope.label];
    $scope.descGotFocus = false;
    $scope.revised_node = { properties: { title: newComponentTitle, description: newComponentTitle, image_url: "" }, labels: $scope.labels };
    $scope.new_date = new Date();

    $scope.submit = function () {
      localStorage.removeItem('newComponentTitle');
      if($scope.revised_node.labels[0] == "Milestone"){
        $scope.revised_node.properties.comments = [];
        $scope.revised_node.properties.history = [];
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = mm + '/' + dd + '/' + yyyy;

        let comment = {
          title : `created by '${$rootScope.Person.properties.email}'`,
          date : `'${today}'`
        }

        let history = {
          progress : 0,
          date : today
        }

        $scope.revised_node.properties.comments.push(comment);
        $scope.revised_node.properties.history.push(history);
      }
        SharedAPI.PostNode({ revised: $scope.revised_node, author_uuid: $rootScope.Person.properties.uuid }).then((resp) => {
            if(onSuccess) onSuccess(resp);
            $uibModalInstance.close();
             $state.reload();
             //$rootScope.$broadcast('add-success');
        }).catch(function (err) {
            sweetAlert.swal({
                title: "Error!",
                text: err.message,
                type: "error"
            });
        });
    }
    $scope.cancel = function () {
        $uibModalInstance.close();
        localStorage.removeItem('newComponentTitle');
        //$rootScope.$broadcast('clearSearch');
    }

    $scope.onStartDateChange = function(){
      $scope.revised_node.properties.deadline = $scope.revised_node.properties.startDate;
    }
}

function editNodeCtrl(SortProperties, $rootScope, $timeout, Scores, Kpis, $scope, $http, sweetAlert, GraphJS, $state, SharedAPI, $uibModalInstance, label, uuid , onSuccess, dynamicFields) {
  let headers = {}
  if(label == 'milestone') {
    $scope.milestone = uuid;
    headers = { 'force-delete': true }
    uuid = uuid.uuid;
  }

  $scope.modValue = true;
  $scope.modValue1 = false;


  $scope.Getting = true;
  SharedAPI.GetNode(uuid).then(function (result) {

      if (label == 'project' || label == 'milestone') { // Get all notes under that project so we can not delete if there is any note available
      debugger;
      $scope.isMilestoneAvailable = false;
      $scope.disabledTitle = "";
      SharedAPI.GetNode(uuid , true).then(function (result) {
        $scope.Getting = false;
        if(result.node_label_index.Milestone && result.node_label_index.Milestone.length > 0){
          $scope.isMilestoneAvailable = true;
          $scope.disabledTitle = "Please remove all notes and milestones before deleting project"
        }

        if(label == 'milestone'){
          $scope.notesAvailable = false;
          var noteCount = 0;
          for(key in result.nodes){
            if(noteCount == 2){
              $scope.notesAvailable = true;
              $scope.disabledTitle = "There are more than one note available";
              break;
            }
            if(result.nodes[key].labels[0] == 'Note'){
              noteCount++
            }
          }
        }

        $scope.initial_state = JSON.parse(JSON.stringify(result));
        $scope.revised_state = JSON.parse(JSON.stringify(result));
        $scope.revised_node = $scope.revised_state.nodes[Object.keys($scope.revised_state.nodes)[0]];
        if(label == 'milestone'){
          $scope.initial_state.nodes[Object.keys($scope.initial_state.nodes)[0]].properties.sequence = parseInt($scope.initial_state.nodes[Object.keys($scope.initial_state.nodes)[0]].properties.sequence);
          $scope.revised_node.properties.sequence = parseInt($scope.revised_node.properties.sequence);
        }
      })
    }else{

      $scope.Getting = false;
      $scope.initial_state = JSON.parse(JSON.stringify(result));
      $scope.revised_state = JSON.parse(JSON.stringify(result));
      $scope.revised_node = $scope.revised_state.nodes[Object.keys($scope.revised_state.nodes)[0]];

      if (label == 'journey') {
        $scope.sortOptions = SortProperties;
        // $scope.journey = $scope.revised_state.nodes[Object.keys($scope.revised_state.nodes)[0]];
        $scope.interactions = [];
        $scope.correlations = [];
        var letters = ['a', 'b', 'c', 'd', 'e', 'f']
        letters.forEach(function (letter) {
          if (typeof $scope.revised_node.properties['correlation_' + letter] === 'string') {
            $scope.revised_node.properties['correlation_' + letter] = dynamicFields['correlation_' + letter]
          }
          $scope.correlations.push({
            label: 'Correlation ' + letter,
            property: 'correlation_' + letter
          })
        })
        // KPI's
        $scope.revised_node.kpis = [];
        Kpis.journey($scope.revised_node.properties.uuid).then(function (kpis) {
          $scope.revised_node.kpis = kpis;
        })

        // get autmatic score
        $scope.revised_node.properties.interactions = $rootScope.currentJourneyInteractions
        $scope.journey_automatic_score = Scores.journey_automatic_score($scope.revised_node.properties)

        $scope.updateIndexAverage = function (idx, model) {
          console.log(model)
          var n = 0;
          model.forEach(function (obj) {
            n += ($scope.revised_node.properties[obj.property].value || 0)
          })
          n = (n / model.length) || 0;
          $scope.revised_node.properties[idx + '_avg'] = n;
        }

        $scope.popoverData = function (string) {
          switch (string) {
            case 'effective':
              $scope.importantIsOpen = false;
              break;
            case 'important':
              $scope.effectiveIsOpen = false;
              break;
          }
          $scope.currentPopover = string
        }

        $scope.selectInteraction = function (uuid) {
          $scope[$scope.currentPopover + 'IsOpen'] = false;
          $scope.revised_node.properties[$scope.currentPopover + '_score_interaction'] = uuid;
        }

        $scope.getInteractionTitle = function (uuid) {
          var title;
          if(typeof($rootScope.currentJourneyInteractions) == "string"){
            $rootScope.currentJourneyInteractions = JSON.parse($rootScope.currentJourneyInteractions);
          }

          $rootScope.currentJourneyInteractions.forEach(function (int) {
            if (int.uuid === uuid) {
              title = int.title;
              $scope.journey_effectiveness_score = int.effectiveness;
              $scope.journey_importance_score = int.importance;
            }
          })
          return title;
        }
      }
    }
    if(!$scope.revised_node.properties.hasOwnProperty('live_mode')){
        $scope.revised_node.properties.live_mode = false;
    }

  })

  if (dynamicFields) $scope.dynamicFields = dynamicFields;
  if (label) {
    $scope.label = label.charAt(0).toUpperCase() + label.slice(1);
  }

  $scope.PopDeleteAlert = function () {
    console.log('1');
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover this item!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!",
      showLoaderOnConfirm: true
    },
      function () {
        SharedAPI.DeleteNode(uuid, headers).then((resp) => {
          if (onSuccess) {
            onSuccess(resp)
            if (label == 'project') $state.go('dashboard.projects')
          }
          $uibModalInstance.close();
        });
      });
  }

  $scope.cancel = function () {
    $uibModalInstance.close();
  }

  $scope.submit = function () {
    $scope.posting = true;
    let updatedField = null;
    if($scope.revised_node.labels[0] == "Milestone"){
      $scope.revised_node.properties.comments = JSON.parse($scope.revised_node.properties.comments);

      if($scope.initial_state.nodes[$scope.revised_node.properties.uuid].properties.title != $scope.revised_node.properties.title){
          updatedField = 'Title is Updated';
      }else if($scope.initial_state.nodes[$scope.revised_node.properties.uuid].properties.description != $scope.revised_node.properties.description){
          updatedField = 'Description is Updated';
      }else if($scope.initial_state.nodes[$scope.revised_node.properties.uuid].properties.priority != $scope.revised_node.properties.priority){
        updatedField = 'Priority is Updated from '+$scope.initial_state.nodes[$scope.revised_node.properties.uuid].properties.priority+ ' to '+$scope.revised_node.properties.priority ;
      }

      if(updatedField){
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = mm + '/' + dd + '/' + yyyy;

        let comment = {
          title : `'${updatedField}'  by ${$rootScope.Person.properties.title}`,
          date : `'${today}'`
        }
        $scope.revised_node.properties.comments.push(comment);
      }
    }

    let Update = { initial: $scope.initial_state.nodes[$scope.revised_node.properties.uuid], revised: $scope.revised_node };
    SharedAPI.UpdateNode(Update).then((resp) => {
      $uibModalInstance.close();
      if (onSuccess) {
        onSuccess(resp);
      };
    }).catch(function (err) {
      sweetAlert.swal({
        title: "Error!",
        text: err.message,
        type: "error"
      });
    });
  }

  $scope.onStartDateChange = function(){
    $scope.revised_node.properties.deadline = $scope.revised_node.properties.startDate;
  }
};

function deleteNodeCtrl($scope, sweetAlert, GraphJS, SharedAPI, $uibModalInstance, uuid, onSuccess) {
  $scope.cancel = function () {
    $uibModalInstance.close();
  }
  $scope.Getting = false;

  $scope.submit = function () {
    $scope.posting = true;
    SharedAPI.DeleteNode(uuid).then((resp) => {
      $uibModalInstance.close();
      if (onSuccess) onSuccess(resp);
    }).catch(function (err) {
      sweetAlert.swal({
        title: "Error!",
        text: err.message,
        type: "error"
      });
    });
  }
};


function csvCtrl($scope, $window, journey) {
  console.log(journey)
  $scope.SelectFile = function (file) {
    $scope.SelectedFile = file;
  };
  $scope.Upload = function () {
    let isCsv = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
    if(isCsv.test($scope.SelectedFile.name.toLowerCase())) {
      if (typeof (FileReader) != "undefined") {
        let reader = new FileReader();

        reader.onload = function (e) {
          let rows = e.target.result.split("\r\n");

          $scope.importData = {
            headers: rows[0].split(',').reduce((filtered, row) => {
              row = row.trim();
              if(row.length > 0) filtered.push(row);
              return filtered
            }, []),
            columns: {}
          }

          $scope.importData.headers.forEach(header => {
            $scope.importData.columns[header] = []
          })

          rows.shift()

          $scope.importData.rowCount = rows.length

          rows.map((row) => {
            row.split(',').forEach((cell, index) => {
              cell = cell.trim()

              if(cell.length > 0) {
                let key = Object.keys($scope.importData.columns)[index]

                if(key) $scope.importData.columns[key].push(cell)
              }
            })
          })
          console.log($scope.importData)
        }
        reader.readAsText($scope.SelectedFile);
      } else {
        $window.alert("This browser does not support HTML5.");
      }
    } else {
      $window.alert("Please upload a valid CSV file.");
    }
  }
}
