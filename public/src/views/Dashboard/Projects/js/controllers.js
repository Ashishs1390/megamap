function projectTenantCtrl($scope, $http, Alert, $rootScope, $uibModal, ProjectAPI, GraphJS, $state) {
  //Get Local Library
  $scope.search = '';
  $scope.Getting = true;
  $scope.printsub = function(subgraph){
    console.log('init');
    console.log(subgraph);
  }
  ProjectAPI.GetTenantProjectsLibraryView()
    .then(function (projects) {
      $scope.Getting = false;
      $scope.subgraph = projects;
      $scope.subgraph_initial = JSON.parse(JSON.stringify(projects));

    }).catch(function (err) {
      $scope.Getting = false;
      Alert.note(err.message)
    });
  //Set Controller accessible Modals
  $scope.PopEditModal = (data) => PopProjectEditModal(data, $uibModal, () => $state.reload());
  $scope.PopCreateModal = () => PopProjectCreateModal("Project", $uibModal, () => $state.reload());
  $scope.PopAttendeeModal = (data) => PopProjectAttendeeModal(data, $uibModal, () => $state.reload());
}


// show single project
function ProjectCtrl($scope, $rootScope,projectData,$stateParams, SharedAPI, $uibModal, ProjectAPI, $state, GraphJS , ProfileWorkshopAPI) {
  $scope.getting = true;
  ProjectAPI.GetProject($stateParams.uuid).then(function (subgraph) {
    $scope.getting = false;
    projectData.setData(subgraph);
    $scope.milestones = []
    $scope.project = subgraph.nodes[subgraph.node_label_index.Project[0]];
    $scope.author_uuid = Object.keys(subgraph.incoming.author)[0];
    $scope.subgraph = subgraph;
    console.log(subgraph)
    $scope.subgraph_initial = JSON.parse(JSON.stringify(subgraph));
    // start with 0 for project progress
    $scope.project.progress = 0;
    if(subgraph.node_label_index.Milestone){
      $scope.milestones = subgraph.node_label_index.Milestone.map(function(m_uuid){
        $scope.project.progress += ($scope.subgraph.nodes[m_uuid].properties.progress || 0)
        if($scope.subgraph.outgoing["milestone_component"] && $scope.subgraph.outgoing["milestone_component"][m_uuid]){
          $scope.subgraph.nodes[m_uuid].properties.notes = $scope.subgraph.outgoing["milestone_component"][m_uuid].map(function(n_uuid){
            return subgraph.nodes[subgraph.rels[n_uuid].to_id].properties;
          })
        }
        return $scope.subgraph.nodes[m_uuid].properties;
      })
      if($scope.milestones){
        $scope.milestones.map(function(milestone){
          milestone.sequence = parseInt(milestone.sequence);
          milestone.history = JSON.parse(milestone.history);
          milestone.progress = milestone.history[milestone.history.length-1].progress;

          if(milestone.notes){
            milestone.notes.map(function(note){
              
              if((typeof note.projectAssignee) == "string"){
                note.projectAssignee = JSON.parse(note.projectAssignee);
              }
              
              if(isNaN(note.progress)){
                note.progress = 0;
              }
              // if(!note.projectAssignee || note.projectAssignee.includes("undefined")){
              //   note.projectAssignee = $rootScope.Person;
              // }else{
              //   note.projectAssignee = JSON.parse(note.projectAssignee);
              // }
              // if(!note.progress || note.progress.includes("undefined")){
              //   note.progress = 0;
              // }
              // total += parseInt(note.progress);     
            })
           // total = parseInt(total / milestone.notes.length);
          }
          //milestone.progress = total;
          milestone.singleBarSeries = ["Progress"];
          milestone.singleBarOptions =  {
              scales: {
                yAxes: [{ticks: {min: 0, max:100}}]
              }
            }


          milestone.singleBarData   = [];
          milestone.singleBarLabels = [];
          milestone.history = milestone.history.slice(Math.max(milestone.history.length - 6, 0));
          milestone.history.forEach(function(history){
            if(isNaN(history.progress) || !history.progress){
              history.progress = 0;
            }
            milestone.singleBarData.push(history.progress);
            milestone.singleBarLabels.push(history.date);
          })
        })
      }
    }

    $scope.singleBarSeries = ["Progress"];
    $scope.singleBarOptions =  {
        scales: {
          yAxes: [{ticks: {min: 0, max:100}}]
        }
      }


    $scope.singleBarData   = [];
    $scope.singleBarLabels = [];

    $scope.milestones.forEach(function(m){
      if(m.progress) {
        $scope.singleBarData.push(m.progress)
        $scope.singleBarLabels.push(m.title)
      }
    })
    console.log($scope.singleBarData)

    // get rounded project average
    $scope.project.progress = Math.round($scope.project.progress/$scope.milestones.length);
    if($scope.project.progress < 40){
      $scope.project.progressColor = 'bg-danger';
    } else if($scope.project.progress > 40 && $scope.project.progress < 80) {
      $scope.project.progressColor = 'bg-warning';
    } else if($scope.project.progress > 80){
      $scope.project.progressColor = 'bg-success';
    }


    $scope.participants = subgraph.node_label_index.Person.map(function(uuid){
      return $scope.subgraph.nodes[uuid].properties;
    })
  });

  // We are calling this project node API , because we need to update project whenever there is update in note proress
  let innitialProjectNode , revisedProjectNode;
  SharedAPI.GetNode($stateParams.uuid).then(function (result) {
    result.nodes = result.nodes[$stateParams.uuid];
    innitialProjectNode = result.nodes;
    revisedProjectNode = JSON.stringify(result.nodes);
  }) 
  $scope.$on('updateProject' , function(event , milestone){
      let noteCount = 0;
      let progress = 0;
      Object.values($scope.subgraph.nodes).forEach(function(node){
        if(node.labels[0] == 'Milestone'){
          if(node.properties.uuid == milestone.properties.uuid){
            node = milestone;
          }
          let milestoneCurrProgress = parseInt(node.properties.history[node.properties.history.length-1].progress);
          progress += parseInt(milestoneCurrProgress);
          noteCount ++;
        }
      })

      progress = progress ? parseInt(progress/noteCount) : 0;
      revisedProjectNode = JSON.parse(revisedProjectNode);
      revisedProjectNode.properties.progress = progress;

      let Update = { initial: innitialProjectNode, revised: revisedProjectNode };

          SharedAPI.UpdateNode(Update).then((resp) => {
            delete $rootScope.noteProjectAssignee;
            delete $rootScope.isNoteAssigneeOpen;
          }).catch(function (err) {
            delete $rootScope.isNoteAssigneeOpen;
            delete $rootScope.noteProjectAssignee;
            sweetAlert.swal({
              title: "Error!",
              text: err.message,
              type: "error"
            });
          });

  })

  $scope.viewNotes = function(uuid){
    $scope.uuid = uuid
    $scope.viewNotesModal = $uibModal.open({
      templateUrl: 'views/Dashboard/Projects/Milestones/notes.html',
      scope: $scope
    });
  }

  $scope.viewJourneys = function(uuid){
    $scope.uuid = uuid
    $scope.viewJourneysModal = $uibModal.open({
      templateUrl: 'views/Dashboard/Projects/Milestones/journeys.html',
      scope: $scope
    });
  }

  $scope.PopDeleteAlert = function (note) {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover this Note!",
      type: "warning",  
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, Remove it!"
    },
      function () {
        note.properties = {
          uuid : note.uuid
        };
        note.labels = ["Note"];
      GraphJS.RemoveNodeFromLocalSubgraph(note, $scope.subgraph);
      $scope.posting = true;
      [{ label: "Note", type: "milestone_component" }].forEach((it) => {
        for (let i = 0; i < $scope.subgraph.node_label_index[it.label].length; i++) {
          let node_id = $scope.subgraph.node_label_index[it.label][i];
          let rel_id = $scope.subgraph.incoming[it.type][node_id][0];
          let rel = $scope.subgraph.rels[rel_id];
          rel.properties.order = i;
        }
      })
      ProjectAPI.SetMilestoneConnections({
        initial: $scope.subgraph_initial,
        revised: $scope.subgraph
      }).then(function () {
        $state.reload();
        $uibModalInstance.close();
      }).catch(function (err) {

      });
      });
  }
  $scope.cancel = function () {
    $uibModalInstance.close();
  }

  //Launches the edit note overlay
  $scope.open_edit_note = function (uuid) {
    $scope.journeySubGraph = $scope.subgraph;
    $scope.SelectedJourney = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Journey[0]];
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Workshops/Journey/edit_note.html',
      controller: JourneyNoteEditorCtrl,
      resolve: {
        eventScope: function () {
          return $scope;
        },
        uuid: function () {
          return uuid;
        },
        note: function(){
          return null;
        }
      }
    });
  }
  $scope.filterBy = {
    selectedPriority : 'All',
    selectedProgress : {value : 'All', title : 'All'}
  };
  $scope.priorities = ['All',1,2,3,4,5];
  
  $scope.progressList = [{value : 'All', title : 'All'},{value : 25, title : '> 25%'},{value : 50, title : '> 50%'},{value : 75, title : '> 75%'},{value : 100, title : '100%'}];
  $scope.filterMilestones = function(milestone){
    if($scope.filterBy.selectedPriority == 'All' && $scope.filterBy.selectedProgress.value == 'All'){
      return true;
    }else if($scope.filterBy.selectedPriority == 'All' && $scope.filterBy.selectedProgress.value != 'All'){
      return milestone.progress >= $scope.filterBy.selectedProgress.value;
    }else if($scope.filterBy.selectedPriority != 'All' && $scope.filterBy.selectedProgress.value == 'All'){
      return milestone.priority == $scope.filterBy.selectedPriority
    }
    return milestone.priority == $scope.filterBy.selectedPriority && milestone.progress >= $scope.filterBy.selectedProgress.value;
  }
  $scope.getProjectProgress = function(milestone){
    if(milestone.notes){
      let total = 0;
      milestone.notes.forEach(function(note){
        total += parseInt(note.progress);
      })
      return milestone.progress = parseInt(total / milestone.notes.length);
    }else{
      return milestone.progress = 0;
    }
  }

  $scope.predicate = 'startDate';
  
  $scope.sort = function(predicate) {
    $scope.predicate = predicate;
  }
  
  $scope.isSorted = function(predicate) {
    return ($scope.predicate == predicate)
  }


  $scope.PopEditMilestoneModal = (data) => PopMilestoneEditModal(data, $uibModal, () => {$state.reload();  });
  $scope.PopEditMilestoneNoteModal = (data , milestone_uuid) =>{
    $rootScope.currProject = $scope.project;
    PopEditMilestoneNoteModal(data, $scope.subgraph, $scope.subgraph_initial, milestone_uuid, $uibModal, () => $state.reload())
  };
  $scope.PopEditModal = (data) => PopProjectEditModal(data, $uibModal, () => $state.reload());
  $scope.PopNotesModal = (uuid , project_uuid) => {
    delete $rootScope.noteProjectAssignee;
    delete $rootScope.isNoteAssigneeOpen;
    $rootScope.projectInfoForNotes = {
      currProjectUUID  : project_uuid,
      currProjectName : $scope.project.properties.title,
      notesToProject : []
    }

    // $scope.viewNotesModal.close()
    PopMilestoneNoteModal(uuid, $uibModal);
  }
  
  $scope.PopShowCommentsModal = (data) =>  PopMilestoneCommentsModal(data, $uibModal, () => $state.reload());
  $scope.PopJourneysModal = (uuid) => {
    // $scope.viewJourneysModal.close()
    PopMilestoneJourneyModal(uuid, $uibModal);
  }
  $scope.PopAttendeeModal = () => PopProjectAttendeeModal($stateParams.uuid, $uibModal);

  $scope.CreateMilestone = () => {
      PopMilestoneCreateModal('Milestone', $uibModal, function (resp) {
      console.log('response', resp);

      let initial = JSON.parse(JSON.stringify($scope.subgraph));
      let node = resp.nodes[resp.node_label_index.Milestone];
      var SG2 = {};
      GraphJS.MergeNode(node, SG2);
      GraphJS.joinSubGraphs($scope.subgraph, SG2);
      let rel = {
        properties: {}
      };
      let node_id = node.properties.uuid;
      let rel_id = null;
      rel.type = "project_milestone";
      rel.properties.uuid = uuidv4();
      rel.from_id = $stateParams.uuid;
      rel.to_id = node.properties.uuid;
      GraphJS.MergeRelationship(rel, $scope.subgraph);

      ProjectAPI.SetProjectConnections({
        initial: initial,
        revised: $scope.subgraph
      });
    });
  }
};

// project connections
function inviteProjectCtrl($scope,$rootScope,projectData ,project_uuid, SharedAPI, GraphJS, $uibModalInstance, ProjectAPI, $state) {
$rootScope.projectUuid = project_uuid;
  ProjectAPI.GetProjectPage(project_uuid).then(function (projects) {
    $scope.subgraph = projects;
    $scope.subgraph_initial = JSON.parse(JSON.stringify(projects));
  });
  $scope.submit = function () {
    $scope.posting = true;

    [{ label: "Person", type: "project_attendee",typeMil: "milestone_coordinator" ,typeAuth: "author" }].forEach((it) => {
      for (let i = 0; i < $scope.subgraph.node_label_index[it.label].length; i++) {
        let node_id = $scope.subgraph.node_label_index[it.label][i];
        // let rel_id = $scope.subgraph.incoming[it.type][node_id][0] || $scope.subgraph.incoming[it.typeMil][node_id][0] || $scope.subgraph.incoming[it.typeAuth][node_id][0]  ;
        let rel_id;
        if( $scope.subgraph.incoming[it.type].hasOwnProperty(node_id)){
          rel_id = $scope.subgraph.incoming[it.type][node_id][0];
        } else if($scope.subgraph.incoming[it.typeAuth] && $scope.subgraph.incoming[it.typeAuth].hasOwnProperty(node_id)){
          rel_id = $scope.subgraph.incoming[it.typeAuth][node_id][0];
        }else{
          rel_id = $scope.subgraph.incoming[it.typeMil][node_id][0]
        }

        let rel = $scope.subgraph.rels[rel_id];
        rel.properties.order = i;
      }
    })
    ProjectAPI.SetProjectConnections({
      initial: $scope.subgraph_initial,
      revised: $scope.subgraph
    }).then(function () {
      $state.reload();
      $uibModalInstance.close();
    }).catch(function (err) {

    });
  }
};

//project connections
function inviteCoordinatorCtrl($scope,$rootScope ,milestone_uuid, $window, $http, $uibModalInstance, ProjectAPI, $state) {
 
  $scope.milestone_uuid = milestone_uuid;
  $rootScope.milestoneUuid = milestone_uuid;

  ProjectAPI.GetProjectPage($rootScope.currProject.properties.uuid).then(function (projects) {
    $scope.subgraph = projects;
    $scope.subgraph_initial = JSON.parse(JSON.stringify(projects));
  });

  function notifyUser() {
        let uri = $window.location.origin + '/dashboard/project/' + $rootScope.currProject.properties.uuid;
        $http.post('/api/journey/notify', {
            email: $rootScope.noteProjectAssignee.email,
            inviteTo: $rootScope.currProject.properties.title,
            subdomain: '',
            origin: uri
        }).then(function (resp) {
           
        }).catch(function (err) {
            
        })
    }


    $scope.submit = function () {
      $scope.posting = true;
      let found = false , relation;
      delete $rootScope.isNoteAssigneeOpen;
      [{ label: "Person", type: "project_attendee",typeMil: "milestone_coordinator" ,typeAuth: "author" }].forEach((it) => {
        for (let i = 0; i < $scope.subgraph.node_label_index[it.label].length; i++) {
          if(!found){
            let node_id = $scope.subgraph.node_label_index[it.label][i];
            // let rel_id = $scope.subgraph.incoming[it.type][node_id][0] || $scope.subgraph.incoming[it.typeMil][node_id][0] || $scope.subgraph.incoming[it.typeAuth][node_id][0]  ;
            let rel_id;
            if( $scope.subgraph.incoming[it.type].hasOwnProperty(node_id)){
              rel_id = $scope.subgraph.incoming[it.type][node_id][0];
            } else if($scope.subgraph.incoming[it.typeAuth] && $scope.subgraph.incoming[it.typeAuth].hasOwnProperty(node_id)){
              rel_id = $scope.subgraph.incoming[it.typeAuth][node_id][0];
            }else{
              rel_id = $scope.subgraph.incoming[it.typeMil][node_id][0]
            }
    
            let rel = $scope.subgraph.rels[rel_id];
            rel.properties.order = i;
            if($rootScope.noteProjectAssignee.uuid == node_id && rel.type == "project_attendee"){
              relation = rel;
            }
          }
        }
      })
      ProjectAPI.SetProjectTaskConnections({
       rel : relation
      }).then(function () {
        $rootScope.$broadcast('noteAssignee');
        notifyUser(); 
        $uibModalInstance.close();
      }).catch(function (err) {
  
      });
    }



  
  // $scope.submit = function () {
  //   $scope.posting = true;
  //   [{ label: "Person", type: "milestone_coordinator" }].forEach((it) => {
  //     for (let i = 0; i < $scope.subgraph.node_label_index[it.label].length; i++) {
  //       let node_id = $scope.subgraph.node_label_index[it.label][i];
  //       let rel_id = $scope.subgraph.incoming[it.type][node_id][0];
  //       let rel = $scope.subgraph.rels[rel_id];
  //       rel.properties.order = i;
  //     }
  //   })
  //   ProjectAPI.SetMilestoneConnections({
  //     initial: $scope.subgraph_initial,
  //     revised: $scope.subgraph
  //   }).then(function () {
  //     notifyUser();
  //     $rootScope.$broadcast('noteAssignee');
  //     $uibModalInstance.close();
  //   }).catch(function (err) {

  //   });
  // }
};

function commentsCtrl($scope, milestone){
  let comments = JSON.parse(milestone.comments);
   $scope.comments = comments.reverse();
}

function editMilestoneNoteCtrl(SortProperties, $rootScope, milestone_uuid, $uibModal, Kpis, $scope, subgraph, subgraph_initial, sweetAlert, GraphJS, $state, SharedAPI, $uibModalInstance, label, note, onSuccess, dynamicFields , JourneyWorkshopAPI , ProjectAPI){
  let initialNode , revisedNode;
  $scope.noteComment = '';
  $scope.isCommentPush = false;

  $scope.oldAssignee = $rootScope.noteProjectAssignee = note.projectAssignee;
  $rootScope.isNoteAssigneeOpen = true;

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  today = mm + '/' + dd + '/' + yyyy;

  SharedAPI.GetNode(milestone_uuid , true).then(function (result) {
    $scope.Getting = false;
    subgraph = result;
    initialNode = JSON.parse(JSON.stringify(result));
    revisedNode = JSON.parse(JSON.stringify(result));
    $scope.initial_node = initialNode.nodes[Object.keys(initialNode.nodes)[0]];
    $scope.revised_node = revisedNode.nodes[Object.keys(revisedNode.nodes)[0]];
    $scope.revised_node.properties.comments = JSON.parse($scope.revised_node.properties.comments);
    
  })
  note.milestone_uuid = milestone_uuid;
  let progress = note.progress = parseInt(note.progress);
  $scope.note = note; 

  // Following code is added to show graph related to note
  if($scope.note.history){
    if(typeof $scope.note.history === "string"){
      $scope.note.history = JSON.parse($scope.note.history);
    }  
    $scope.singleBarSeries = ["Progress"];
    $scope.singleBarOptions =  {
        scales: {
          yAxes: [{ticks: {min: 0, max:100}}]
        }
      }

    $scope.singleBarData   = [];
    $scope.singleBarLabels = [];
    $scope.note.history = $scope.note.history.slice(Math.max($scope.note.history.length - 6, 0)); 
    $scope.note.history.forEach(function(m){
      if(m.progress) {
        $scope.singleBarData.push(m.progress)
        $scope.singleBarLabels.push(m.date)
      }
    })
  }

  $scope.PopDeleteAlert = function () {
    swal({
      title: "Are you sure?",
      text: "You are about to remove this note from the project milestone, but progress data will be saved.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, Remove it!",
      showLoaderOnConfirm: true
    },
    function () {
      note.properties = {
        uuid : note.uuid
      };
      note.labels = ["Note"];
    GraphJS.RemoveNodeFromLocalSubgraph(note, subgraph);

      // Change History graph array
        let progress = 0;
        let noteCount = 0;
        let milestone = $scope.revised_node , initialMilestone = $scope.initial_node;
        Object.values(subgraph.nodes).forEach(function(node){
          if(node.labels[0] == 'Note'){
            if(isNaN(node.properties.progress)){
              node.properties.progress = 0;
            }
            progress += parseInt(node.properties.progress);
            noteCount ++;
          }
        })

        progress = progress ? parseInt(progress/noteCount) : 0;

        let history = {
          progress : progress,
          date : today
        }
        // milestone.properties.history = JSON.parse(milestone.properties.history) ;
        if(typeof milestone.properties.history === "string"){
          milestone.properties.history = JSON.parse(milestone.properties.history) ;
        } 
        let currProgressValue = parseInt(milestone.properties.history[milestone.properties.history.length-1].progress);
        let comment = {
          title : `'${$scope.note.description} is deleted'  by ${$rootScope.Person.properties.title}`,
          date : `'${today}'`
        } 
        
        //milestone.properties.comments = JSON.parse(milestone.properties.comments);
        if(typeof milestone.properties.comments === "string"){
          milestone.properties.comments = JSON.parse(milestone.properties.comments);
        }
        milestone.properties.comments.push(comment);

        if(currProgressValue){
          milestone.properties.history.push(history);
          initialMilestone = JSON.stringify(initialMilestone);
          initialMilestone = JSON.parse(initialMilestone);
          let Update = { initial: initialMilestone, revised: milestone };

          SharedAPI.UpdateNode(Update).then((resp) => {
            $uibModalInstance.close();
            delete $rootScope.noteProjectAssignee;
            $rootScope.$broadcast('closeMessage');
            $state.reload();
          }).catch(function (err) {
            delete $rootScope.isNoteAssigneeOpen;
            sweetAlert.swal({
              title: "Error!",
              text: err.message,
              type: "error"
            });
          });
        }  

    $scope.posting = true;
    [{ label: "Note", type: "milestone_component" }].forEach((it) => {
      for (let i = 0; i < subgraph.node_label_index[it.label].length; i++) {
        let node_id = subgraph.node_label_index[it.label][i];
        let rel_id = subgraph.incoming[it.type][node_id][0];
        let rel = subgraph.rels[rel_id];
        rel.properties.order = i;
      }
    })
    ProjectAPI.SetMilestoneConnections({
      initial: initialNode,
      revised: subgraph
    }).then(function () { 
      $state.reload();
      $uibModalInstance.close();
    }).catch(function (err) {

    });
    });
  }

  $scope.goToJourney = function(){
    $rootScope.currNote = $scope.note.description
    $state.go('workshop.journey', {'id':$scope.note.journey.uuid});
    $uibModalInstance.close();
  }

  $scope.cancel = function () {
    delete $rootScope.isNoteAssigneeOpen;
    $uibModalInstance.close();
  }

  $scope.$on('noteAssignee',function(){
    $scope.note.projectAssignee = $rootScope.noteProjectAssignee;
    $scope.isNoteAssigneeChanged = true;
  })

  $scope.submit = function () {
    
    let updatedField = null;
    if(progress != $scope.note.progress){
        $scope.revised_node.properties.history = JSON.parse($scope.revised_node.properties.history);
        let noteName = $scope.note.title || $scope.note.description
        updatedField = 'Note '+noteName+' progress is Updated from '+progress+ ' to '+$scope.note.progress ;
        
        if($scope.note.history){
          progress = 0;
          let noteCount = 0;
          Object.values(revisedNode.nodes).forEach(function(node){
            if(node.labels[0] == 'Note'){
              if(node.properties.uuid == $scope.note.uuid){
                progress += parseInt($scope.note.progress);
                // if(typeof $scope.note.history === "string"){
                //   $scope.note.history = JSON.parse($scope.note.history);
                // }
                // $scope.note.history = JSON.parse($scope.note.history);
                $scope.note.history.push({
                  progress : $scope.note.progress,
                  date : today
                })
              }else{
                if(isNaN(node.properties.progress)){
                  node.properties.progress = 0;
                }
                progress += parseInt(node.properties.progress);
              }
              noteCount ++;
            }
          })

          progress = progress ? parseInt(progress/noteCount) : 0;

          // Following code is for milestone history
          let history = {
            progress : progress,
            date : today
          }
          $scope.revised_node.properties.history.push(history);
          $rootScope.$broadcast('updateProject',$scope.revised_node);
      }

    }else if($scope.isNoteAssigneeChanged){
      let oldAssignee = $scope.oldAssignee.title || $scope.oldAssignee.email;
      let newAssignee = $rootScope.noteProjectAssignee.title || $rootScope.noteProjectAssignee.email;
      let noteName = $scope.note.title || $scope.note.description
      updatedField = 'Note '+noteName+' assignee is Updated from '+oldAssignee+ ' to '+newAssignee;
      $scope.note.projectAssignee = $rootScope.noteProjectAssignee;
    }

    if(updatedField){

      let comment = {
        title : `'${updatedField}'  by ${$rootScope.Person.properties.title}`,
        date : `'${today}'`
      } 
      $scope.revised_node.properties.comments.push(comment);

      let Update = { initial: $scope.initial_node, revised: $scope.revised_node };
      SharedAPI.UpdateNode(Update).then((resp) => {
        JourneyWorkshopAPI.UpdateNoteProgress({note: $scope.note})
        .then(function(resp) {
          $scope.posting = false;
          $state.reload();
          $uibModalInstance.close();
          delete $rootScope.noteProjectAssignee;
          $rootScope.$broadcast('closeMessage');
        })
      }).catch(function (err) {
        delete $rootScope.isNoteAssigneeOpen;
        sweetAlert.swal({
          title: "Error!",
          text: err.message,
          type: "error"
        });
      });

    } else{
      delete $rootScope.noteProjectAssignee;
      $uibModalInstance.close();
    }
  }

  $scope.pushComment = function(){
    
    if($scope.noteComment.length){
      $scope.isCommentPush = true;
      var rel = {
        from_id: $rootScope.Person.properties.uuid,
        to_id: $scope.note.uuid,
        type: "comment",
        properties: {
          comment: $scope.noteComment,
          voc:  false ,
          task: false,
          pmo : true,
          rank: $scope.note.progress ? (note.progress / 10).toFixed(0) : 0,
          uuid: uuidv4()
        }
      };
      $scope.noteComment = '';
      JourneyWorkshopAPI.PostComment(rel).then((data) => {
        $scope.isCommentPush = false;
      });
    }
  }

  $scope.PopCoordinatorModal = (uuid) => {
    $scope.isNoteAssigneeChanged = false;
    PopMilestoneCoordinatorModal(uuid, $uibModal) };
}

function linkNotesCtrl($scope, milestone_uuid, SharedAPI,sweetAlert, $rootScope, $uibModalInstance, ProjectAPI, JourneyWorkshopAPI , $state) {
 
  $scope.milestone_uuid = milestone_uuid;
  ProjectAPI.GetMilestoneConnections(milestone_uuid).then(function (milestone) {
    $scope.subgraph = milestone;
    $scope.subgraph_initial = JSON.parse(JSON.stringify(milestone));
    console.log('made it here')
  });

  function getDate(){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    return  mm + '/' + dd + '/' + yyyy;
  }

  $scope.submit = function () {
    $scope.posting = true;
    [{ label: "Note", type: "milestone_component" }].forEach((it) => {
      for (let i = 0; i < $scope.subgraph.node_label_index[it.label].length; i++) {
        let node_id = $scope.subgraph.node_label_index[it.label][i];
        let rel_id = $scope.subgraph.incoming[it.type][node_id][0];
        let rel = $scope.subgraph.rels[rel_id];
        rel.properties.order = i;
      }
    })
    // following code is added to check whih notes are added and which removed
    let milestone_uuid;
    for(let key in $scope.subgraph.nodes){
      if($scope.subgraph.nodes[key].labels == "Milestone"){
        milestone_uuid = key;
        $scope.subgraph.nodes[key].properties.comments = JSON.parse($scope.subgraph.nodes[key].properties.comments);
        $scope.subgraph_initial.nodes[key].properties.comments = JSON.parse($scope.subgraph_initial.nodes[key].properties.comments);
        break;
      }
    }
      let currMilestoneHistory = $scope.subgraph.nodes[milestone_uuid].properties.history = JSON.parse($scope.subgraph.nodes[milestone_uuid].properties.history);
      let currProgressValue = parseInt(currMilestoneHistory[currMilestoneHistory.length-1].progress);
      if(currProgressValue){
        
        let progress = 0;
        let noteCount = 0;
        
          Object.values($scope.subgraph.nodes).forEach(function(node){
            if(node.labels[0] == 'Note'){
              if(isNaN(node.properties.progress)){
                node.properties.progress = 0;
              }
              progress += parseInt(node.properties.progress);
              noteCount ++;
            }
          })

          progress = progress ? parseInt(progress/noteCount) : 0;

          let history = {
            progress : progress,
            date : getDate()
          }
          currMilestoneHistory.push(history);
    }

    $rootScope.projectInfoForNotes.notesToProject.forEach(function(note){
      note.properties['history'] = [
        {
          progress : 0,
          date : getDate()
        }
      ]
      note.properties.projectAssignee = $rootScope.Person.properties;
      let title = note.properties.title || note.properties.description;
      let date = getDate();
      let comment = {
        title : `Note '${title}' is added by ${$rootScope.Person.properties.email}`,
        date : `'${date}'`
      }
      $scope.subgraph.nodes[milestone_uuid].properties.comments.push(comment);
      note.properties.projectUUID = $rootScope.projectInfoForNotes.currProjectUUID;
      note.properties.projectName = $rootScope.projectInfoForNotes.currProjectName;
      JourneyWorkshopAPI.UpdateNoteProgress({note: note.properties})
      .then(function(resp) {
        delete $rootScope.projectInfoForNotes;
        console.log('success');
      }).catch(function (err) {
        sweetAlert.swal({
          title: "Error!",
          text: err.message,
          type: "error"
        });
      });

    })

    let Update = { initial: $scope.subgraph_initial.nodes[milestone_uuid], revised: $scope.subgraph.nodes[milestone_uuid] };
    SharedAPI.UpdateNode(Update).then((resp) => {
      $uibModalInstance.close();
      $state.reload()
    }).catch(function (err) {
      sweetAlert.swal({
        title: "Error!",
        text: err.message,
        type: "error"
      });
    });


    ProjectAPI.SetMilestoneConnections({
      initial: $scope.subgraph_initial,
      revised: $scope.subgraph
    }).then(function () {
      $state.reload();
      //$uibModalInstance.close();
    }).catch(function (err) {

    });
  }

  $scope.cancel = function(){
    $uibModalInstance.close();
  }
};

function linkJourneysCtrl($scope, milestone_uuid, SharedAPI, GraphJS, $uibModalInstance, ProjectAPI, $state) {
  $scope.milestone_uuid = milestone_uuid;
  ProjectAPI.GetMilestoneConnections(milestone_uuid).then(function (milestone) {
    console.log(milestone)
    $scope.subgraph = milestone;
    $scope.subgraph_initial = JSON.parse(JSON.stringify(milestone));
  });

  $scope.submit = function () {
    $scope.posting = true;
    [{ label: "Journey", type: "milestone_journey" }].forEach((it) => {
      for (let i = 0; i < $scope.subgraph.node_label_index[it.label].length; i++) {
        let node_id = $scope.subgraph.node_label_index[it.label][i];
        let rel_id = $scope.subgraph.incoming[it.type][node_id][0];
        let rel = $scope.subgraph.rels[rel_id];
        rel.properties.order = i;
      }
    })
    ProjectAPI.SetMilestoneConnections({
      initial: $scope.subgraph_initial,
      revised: $scope.subgraph
    }).then(function () {
      $state.reload();
      $uibModalInstance.close();
    }).catch(function (err) {

    });
  }
};
