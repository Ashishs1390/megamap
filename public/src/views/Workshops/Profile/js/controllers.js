
function personaProfileCtrl($scope, $stateParams, $state, $uibModal, $rootScope, notify, sweetAlert, ProfileWorkshopAPI, GraphJS) {

  // let Socket = socket($scope);
  // Socket.connect($stateParams.id);
  // // Socket.on('ping', (data) => console.log(data));
  // Socket.on("post.note", (data) => {
  //   GraphJS.joinSubGraphs($scope.profileSubGraph, data);
  // });
  // Socket.on("put.note", (data) => {
  //   GraphJS.RemoveRels($scope.profileSubGraph, data.Missing);
  //   GraphJS.joinSubGraphs($scope.profileSubGraph, data.Extra);
  // })

  $scope.profileSubGraph = {};
  $scope.profile_uuid = $stateParams.id;
  $scope.Getting = true;

  $scope.UnSelectedInteractions = []

  $scope.sorted_types = [{
    "label": "Attribute",
    "type": "profile_attributes"
  }, {
    "label": "Interaction",
    "type": "profile_interactions"
  }]

  ProfileWorkshopAPI.SyncProfileWorkshop($stateParams.id).then((response) => {
    $scope.Getting = false;
    $scope.profileSubGraph = response;

    // Sort based on orders that set from subscriber.
    $scope.sorted_types.forEach((it) => {
      if ($scope.profileSubGraph.node_label_index[it.label]) {
        $scope.profileSubGraph.node_label_index[it.label].sort((a, b) => {
          if (!$scope.profileSubGraph.incoming[it.type][a] || !$scope.profileSubGraph.incoming[it.type][b]) return;
          let rel_id_a = $scope.profileSubGraph.incoming[it.type][a][0];
          let rel_id_b = $scope.profileSubGraph.incoming[it.type][b][0];

          let rel_a = $scope.profileSubGraph.rels[rel_id_a];
          let rel_b = $scope.profileSubGraph.rels[rel_id_b];
          return rel_a.properties.order - rel_b.properties.order;
        })
      }
    })

    $scope.SelectedProfile = $scope.profileSubGraph.nodes[$scope.profileSubGraph.node_label_index.Profile[0]];
    $scope.SelectedAttribute = $scope.profileSubGraph.nodes[$scope.profileSubGraph.node_label_index.Attribute[0]];
    $scope.SelectedInteraction = $scope.profileSubGraph.nodes[$scope.profileSubGraph.node_label_index.Interaction[0]];
    $scope.SelectedPersona = $scope.profileSubGraph.nodes[$scope.profileSubGraph.node_label_index.Persona[0]];
    $scope.SelectedStrategy = $scope.profileSubGraph.nodes[$scope.profileSubGraph.node_label_index.Strategy[0]];
    $scope.SelectedProduct = $scope.profileSubGraph.nodes[$scope.profileSubGraph.node_label_index.Product[0]];
    $scope.ProfileInteractions = $scope.profileSubGraph.node_label_index.Interaction.map((item) => {
      return $scope.profileSubGraph.nodes[item]
    })
    $scope.ProfileAttributes = $scope.profileSubGraph.node_label_index.Attribute.map((item) => {
      return $scope.profileSubGraph.nodes[item];
    });

    $scope.sortValue = $scope.SortOrders[2];
    $scope.sortBy($scope.sortValue)

    if ($rootScope.Person.role === 'admin' || $rootScope.Person.role === 'tenant') {
      $scope.PopAttendeeModal = (data) => PopProfileAttendeeModal(data, $uibModal);
    }
    $scope.PopQuickReportModal = (data) => PopProfileQuickReportModal(data, $uibModal);

  })

  $scope.sort_attribute_notes_by_property = function (property_title) {
    console.log('sort by property');
    $scope.sorted_property = property_title;
    if ($scope.profileSubGraph.incoming.note_attribute && $scope.profileSubGraph.incoming.note_attribute[$scope.SelectedAttribute.properties.uuid]) {
      $scope.profileSubGraph.incoming.note_attribute[$scope.SelectedAttribute.properties.uuid].sort((rel_id_a, rel_id_b) => {
        let rel_a = $scope.profileSubGraph.rels[rel_id_a];
        let rel_b = $scope.profileSubGraph.rels[rel_id_b];

        let note_a = $scope.profileSubGraph.nodes[rel_a.from_id];
        let note_b = $scope.profileSubGraph.nodes[rel_b.from_id];

        let val_a = note_a.properties[property_title] || 0;
        let val_b = note_b.properties[property_title] || 0;

        if ($scope.sortValue.reverse) {
          return val_a - val_b;
        } else {
          return val_b - val_a;
        }
      })
    }
  }
  $scope.sort_attribute_notes_by_rel_count = function (rel_type) {
    console.log('sort by importance/pain/comment');
    $scope.sorted_property = rel_type;
    if ($scope.profileSubGraph.incoming.note_attribute && $scope.profileSubGraph.incoming.note_attribute[$scope.SelectedAttribute.properties.uuid]) {
      $scope.profileSubGraph.incoming.note_attribute[$scope.SelectedAttribute.properties.uuid].sort((rel_id_a, rel_id_b) => {
        let rel_a = $scope.profileSubGraph.rels[rel_id_a];
        let rel_b = $scope.profileSubGraph.rels[rel_id_b];

        let note_a = $scope.profileSubGraph.nodes[rel_a.from_id];
        let note_b = $scope.profileSubGraph.nodes[rel_b.from_id];

        let count_a = 0;
        let count_b = 0;
        if (!$scope.profileSubGraph.incoming[rel_type]) return 0;
        if ($scope.profileSubGraph.incoming[rel_type][note_a.properties.uuid]) count_a = $scope.profileSubGraph.incoming[rel_type][note_a.properties.uuid].length;
        if ($scope.profileSubGraph.incoming[rel_type][note_b.properties.uuid]) count_b = $scope.profileSubGraph.incoming[rel_type][note_b.properties.uuid].length;
        return count_b - count_a;
      })
    }
  }

  /*This is not used for now since it's identical to sort_stage_notes_by_rel_count() unless voting mechanism changes.*/
  // $scope.sort_attribute_notes_by_importance = function () {
  //   console.log('sort by importance or comment');
  //   if ($scope.profileSubGraph.incoming.note_attribute && $scope.profileSubGraph.incoming.note_attribute[$scope.SelectedAttribute.properties.uuid]) {
  //     $scope.profileSubGraph.incoming.note_attribute[$scope.SelectedAttribute.properties.uuid].sort((rel_id_a, rel_id_b) => {
  //       let rel_a = $scope.profileSubGraph.rels[rel_id_a];
  //       let rel_b = $scope.profileSubGraph.rels[rel_id_b];

  //       let note_a = $scope.profileSubGraph.nodes[rel_a.from_id];
  //       let note_b = $scope.profileSubGraph.nodes[rel_b.from_id];

  //       let count_a = 0;
  //       let count_b = 0;

  //       if ($scope.profileSubGraph.incoming["vote"]) {
  //         if ($scope.profileSubGraph.incoming['vote'][note_a.properties.uuid]) count_a += $scope.profileSubGraph.incoming['vote'][note_a.properties.uuid].length;
  //         if ($scope.profileSubGraph.incoming['vote'][note_b.properties.uuid]) count_b += $scope.profileSubGraph.incoming['vote'][note_b.properties.uuid].length;
  //       }

  //       return count_b - count_a;
  //     })
  //   }
  // }

  $scope.sort_attr_notes_by_rel_order = function (props) {
    console.log('sort by Interaction only');
    let direction = props.direction;
    let rel_type = props.rel_type;
    if ($scope.profileSubGraph.incoming.note_attribute && $scope.profileSubGraph.incoming.note_attribute[$scope.SelectedAttribute.properties.uuid]) {
      $scope.profileSubGraph.incoming.note_attribute[$scope.SelectedAttribute.properties.uuid].sort((rel_id_a, rel_id_b) => {
        let rel_a = $scope.profileSubGraph.rels[rel_id_a];
        let rel_b = $scope.profileSubGraph.rels[rel_id_b];

        let note_a = $scope.profileSubGraph.nodes[rel_a.from_id];
        let note_b = $scope.profileSubGraph.nodes[rel_b.from_id];

        let rel_type_a = $scope.profileSubGraph.nodes[$scope.profileSubGraph.rels[$scope.profileSubGraph[direction][rel_type][note_a.properties.uuid][0]].to_id];
        let rel_type_b = $scope.profileSubGraph.nodes[$scope.profileSubGraph.rels[$scope.profileSubGraph[direction][rel_type][note_b.properties.uuid][0]].to_id];

        let profile_rel_a = $scope.profileSubGraph.rels[$scope.profileSubGraph.incoming.profile_interactions[rel_type_a.properties.uuid][0]];
        let profile_rel_b = $scope.profileSubGraph.rels[$scope.profileSubGraph.incoming.profile_interactions[rel_type_b.properties.uuid][0]];

        return profile_rel_a.properties.order - profile_rel_b.properties.order;
      })
    }
  }


  // needs to sort by interaction by default.
  $scope.SortOrders = [
    { display: "Importance", func: $scope.sort_attribute_notes_by_rel_count, props: 'vote' },
    { display: "Pain", func: $scope.sort_attribute_notes_by_rel_count, props: 'pain' },
    { display: "Interaction", func: $scope.sort_attr_notes_by_rel_order, props: { direction: "outgoing", rel_type: "note_interaction" } },
    { display: "Sample Size", func: $scope.sort_attribute_notes_by_property, props: 'sample_size' },
    { display: "Average Importance", func: $scope.sort_attribute_notes_by_property, props: 'average_importance' },
    { display: "Average Effectiveness", func: $scope.sort_attribute_notes_by_property, props: 'average_effectiveness' },
    { display: "Gap", func: $scope.sort_attribute_notes_by_property, props: 'gap', reverse: true },
    { display: "Comment", func: $scope.sort_attribute_notes_by_rel_count, props: 'comment' }
    // { display: "None", func: $scope.sort_attribute_notes_by_property, props: 'created_at' }
  ];

  $scope.sortBy = function (selectedSortValue) {
    $scope.selectedSortValue = selectedSortValue;
    selectedSortValue.func(selectedSortValue.props)
  }

  // Detect unselected interaction
  $scope.ToggleVisibleInteraction = function (interactionProp) {
    ~$scope.UnSelectedInteractions.indexOf(interactionProp.uuid) ?
    $scope.UnSelectedInteractions.splice($scope.UnSelectedInteractions.indexOf(interactionProp.uuid), 1) :
    $scope.UnSelectedInteractions.push(interactionProp.uuid);
  }

  // Reset interaction type, but remain sorted option when switch attributes
  $scope.SetSelectedAttribute = function (attribute) {
    $scope.SelectedAttribute = attribute;
    $scope.UnSelectedInteractions = []
    $scope.sortBy($scope.selectedSortValue)
  }

  $scope.InteractionFromNote = function (note) {
    let profileSubGraph = $scope.profileSubGraph;
    let to_node_uuid = GraphJS.FindInteractionFromNote(note, profileSubGraph).to_node_uuid;
    let index = $scope.UnSelectedInteractions.indexOf(to_node_uuid)
    return (index > -1);
  }

  $scope.open_note_creator = function () {
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Workshops/Profile/create_note.html',
      controller: ProfileNoteCreatorCtrl,
      resolve: {
        eventScope: function () {
          return $scope;
        }
      }
    });
  };
  //Launches the edit note overlay
  $scope.open_edit_note = function (uuid) {
    console.log("edit: " + uuid);
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Workshops/Profile/edit_note.html',
      controller: ProfileNoteEditorCtrl,
      resolve: {
        eventScope: function () {
          return $scope;
        },
        uuid: function () {
          return uuid;
        }
      }
    });
  }

}

function ProfileNoteCreatorCtrl($scope, $rootScope, $uibModalInstance, eventScope, sweetAlert, GraphJS, ProfileWorkshopAPI) {
  $scope.eventScope = eventScope;
  $scope.note = {
    properties: {
      title: "",
      image_url: "",
      description: "",
      external_url: ""
    }
  };

  $scope.cancel = function () {
    $uibModalInstance.close();
  }
  $scope.submit = function () {
    $scope.posting = true;
    var post_data = {
      note: $scope.note,
      profile_id: eventScope.SelectedProfile.properties.uuid,
      attribute_id: eventScope.SelectedAttribute.properties.uuid,
      interaction_id: eventScope.SelectedInteraction.properties.uuid,
      author_id: $rootScope.Person.properties.uuid
    };
    ProfileWorkshopAPI.PostNote(post_data).then(() => $uibModalInstance.close());
  }
};


function ProfileNoteEditorCtrl($scope, sweetAlert, Alert, GraphJS, ProfileWorkshopAPI, $uibModalInstance, eventScope, uuid) {
  $scope.eventScope = eventScope;
  $scope.note = JSON.parse(JSON.stringify(eventScope.profileSubGraph.nodes[uuid]));

  let note_attribute_rel = eventScope.profileSubGraph.rels[eventScope.profileSubGraph.outgoing.note_interaction[uuid][0]];
  let note_interaction_rel = eventScope.profileSubGraph.rels[eventScope.profileSubGraph.outgoing.note_attribute[uuid][0]];
  let note_attribute = eventScope.profileSubGraph.nodes[note_attribute_rel.to_id];
  let note_interaction = eventScope.profileSubGraph.nodes[note_interaction_rel.to_id];


  $scope.subgraph = {};
  GraphJS.MergeNode($scope.note, $scope.subgraph);
  GraphJS.MergeNode(note_attribute, $scope.subgraph);
  GraphJS.MergeNode(note_interaction, $scope.subgraph);
  GraphJS.MergeNode(eventScope.SelectedProfile, $scope.subgraph);
  GraphJS.MergeRelationship(note_attribute_rel, $scope.subgraph);
  GraphJS.MergeRelationship(note_interaction_rel, $scope.subgraph);

  $scope.initial_subgraph = JSON.parse(JSON.stringify($scope.subgraph));

  $scope.pivot = uuid;

  $scope.attribute_pool = {};
  eventScope.profileSubGraph.node_label_index.Attribute.forEach((_uuid) => { GraphJS.MergeNode(eventScope.profileSubGraph.nodes[_uuid], $scope.attribute_pool) });

  $scope.interaction_pool = {};
  eventScope.profileSubGraph.node_label_index.Interaction.forEach((_uuid) => { GraphJS.MergeNode(eventScope.profileSubGraph.nodes[_uuid], $scope.interaction_pool) });

  $scope.PopDeleteAlert = function () {
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover this Note!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete it!"

    },
      function () {
        ProfileWorkshopAPI.DeleteNote(uuid);
        $uibModalInstance.close();
      });
  }
  $scope.cancel = function () {
    $uibModalInstance.close();
  }
  $scope.submit = function () {

    $scope.posting = true;

    ProfileWorkshopAPI.UpdateNote({
      initial: $scope.initial_subgraph,
      revised: $scope.subgraph
    }).then(function () {
      sweetAlert.swal({
        title: "Success!",
        text: "Your profile will be updated",
        type: "success",
      }, function (isConfirm) {

        $uibModalInstance.close();
      });
    }).catch(function (err) {
      Alert.note(err.message)
    });
  }
};
