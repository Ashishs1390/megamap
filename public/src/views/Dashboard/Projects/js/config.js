app.controller('projectTenantCtrl', projectTenantCtrl)
app.controller('ProjectCtrl', ProjectCtrl)
app.controller('inviteProjectCtrl', inviteProjectCtrl)
app.controller('inviteCoordinatorCtrl', inviteCoordinatorCtrl)
app.controller('commentsCtrl', commentsCtrl) 
app.controller('linkNotesCtrl', linkNotesCtrl)
app.controller('linkJourneysCtrl', linkJourneysCtrl)
app.controller('editMilestoneNoteCtrl', editMilestoneNoteCtrl);

app.factory('projectData',function(){
  let projectData = null;
  return {
    setData:function(data){
      console.log(data);
      projectData = data;
    },
    getData:function(){
      return projectData;
    }
  };
});
function PopProjectAttendeeModal(uuid, $uibModal) {
  $uibModal.open({
    templateUrl: 'views/Dashboard/Projects/invite.html',
    controller: 'inviteProjectCtrl',
    resolve: {
      project_uuid: function () {
        return uuid;
      }
    }
  });
}

function PopProjectCreateModal(label, $uibModal, onSuccess) {
  var modalInstance = $uibModal.open({
    templateUrl: 'views/Dashboard/Projects/create.html',
    controller: "createNodeCtrl",
    resolve: {
      label: function () {
        return label;
      },
      dynamicFields: function () {
          return false;
      },
      workshopType: function () {
          return null;
      },
      onSuccess: function () {
        return onSuccess;
      }
    }
  });
}
function PopProjectEditModal(uuid, $uibModal, onSuccess) {
  var modalInstance = $uibModal.open({
      templateUrl: 'views/Dashboard/Projects/edit.html',
      controller: "editNodeCtrl",
      resolve: {
          label: function () {
              return 'project';
          },
          uuid: function () {
              return uuid;
          },
          dynamicFields: function () {
              return false;
          },
          workshopType: function () {
              return null;
          },
          onSuccess: function () {
              return onSuccess;
          }
      }
  });
}

function PopMilestoneCreateModal(label, $uibModal, onSuccess) {
  var modalInstance = $uibModal.open({
    templateUrl: 'views/Dashboard/Projects/Milestones/create.html',
    controller: "createNodeCtrl",
    resolve: {
      label: function () {
        return label;
      },
      dynamicFields: function () {
          return false;
      },
      workshopType: function () {
          return null;
      },
      onSuccess: function () {
        return onSuccess;
      }
    }
  });
}

function PopMilestoneCommentsModal(milestone, $uibModal) {
  $uibModal.open({
    templateUrl: 'views/Dashboard/Projects/Milestones/comments.html',
    controller: "commentsCtrl",
    resolve: {
      milestone: function () {
            return milestone;
        }
    }
  });
}

function PopMilestoneEditModal(milestone, $uibModal, onSuccess) {
  var modalInstance = $uibModal.open({
    templateUrl: 'views/Dashboard/Projects/Milestones/edit.html',
    controller: "editNodeCtrl",
    resolve: {
        label: function () {
            return 'milestone';
        },
        uuid: function () {
          return milestone;
        },
        dynamicFields: function () {
            return false;
        },
        workshopType: function () {
            return null;
        },
        onSuccess: function () {
            return onSuccess;
        }
    }
  });
}

function PopMilestoneCoordinatorModal(uuid, $uibModal) {
  $uibModal.open({
    templateUrl: 'views/Dashboard/Projects/invite_coordinator.html',
    controller: 'inviteCoordinatorCtrl',
    resolve: {
      milestone_uuid: function () {
        return uuid;
      }

    }
  });
}

function PopMilestoneNoteModal(uuid, $uibModal) {
  console.log('uuid', uuid)
  $uibModal.open({
    templateUrl: 'views/Dashboard/Projects/milestone_components.html',
    controller: 'linkNotesCtrl',
    backdrop: 'static',
    resolve: {
      milestone_uuid: function () {
        return uuid;
      }
    }
  });
}

function PopMilestoneJourneyModal(uuid, $uibModal) {
  console.log('uuid', uuid)
  $uibModal.open({
    templateUrl: 'views/Dashboard/Projects/milestone_journeys.html',
    controller: 'linkJourneysCtrl',
    resolve: {
      milestone_uuid: function () {
        return uuid;
      }
    }
  });
}

function PopEditMilestoneNoteModal(note, subgraph,subgraph_initial, milestone_uuid, $uibModal, onSuccess) {
  $uibModal.open({
    templateUrl: 'views/Dashboard/Projects/milestone_note_edit.html',
    controller: "editMilestoneNoteCtrl",
    keyboard: false,
    backdrop: 'static',
    resolve: {
        label: function () {
            return 'note';
        },
        note: function () {
            return note;
        },
        subgraph : function(){
          return subgraph;
        },
        subgraph_initial : function(){
          return subgraph_initial;
        },
        milestone_uuid : function(){
          return milestone_uuid;
        },
        dynamicFields: function () {
            return false;
        },
        workshopType: function () {
            return null;
        },
        onSuccess: function () {
            return onSuccess;
        }
    }
  });
}