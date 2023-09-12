function profileTenantCtrl($scope, $http, Alert, $state, $rootScope, $uibModal, ProfileAPI, GraphJS) {
    //Get Local Library
    $scope.Getting = true;
    $scope.search = '';

    ProfileAPI.GetTenantProfiles()
        .then(function (profiles) {
            $scope.Getting = false;
            $scope.library = profiles;
            if($scope.library.node_label_index.Profile){
              $scope.library.node_label_index.Profile.sort((a,b)=>{
                let node_a = $scope.library.nodes[a];
                let node_b = $scope.library.nodes[b];
                let author_uuid_a = $scope.library.outgoing_nodes.author[a][0];
                let author_uuid_b = $scope.library.outgoing_nodes.author[b][0];
                if(author_uuid_a == $rootScope.Person.properties.uuid) return 0;
                else return 1;
              })
            }
        }).catch(function (err) {
            $scope.Getting = false;
            // Alert.note(err.message)
        });

    //Set Controller accessible Modals
    $scope.PopEditModal = (data) => PopProfileEditModal(data, $uibModal, () => $state.reload());
    $scope.PopCreateModal = (data) => PopProfileCreateModal(data, $uibModal, () => $state.reload());
    $scope.PopConnectModal = (data) => PopProfileConnectModal(data, $uibModal);
    $scope.PopAttendeeModal = (data) => PopProfileAttendeeModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopProfileQuickReportModal(data, $uibModal);
    $scope.ViewReport = function (item) {
        $state.go("reports.profile", { uuid: item });
    }
}

function profileAdminCtrl($scope, $http, Alert, $rootScope, $uibModal, ProfileAPI, GraphJS, $state) {
    //Get Profiles for this controller
    $scope.Getting = true;
    $scope.search = '';

    ProfileAPI.GetAdminProfiles($rootScope.Person.properties.uuid)
        .then(function (profiles) {
            $scope.Getting = false;
            $scope.library = profiles;
            if($scope.library.node_label_index.Profile){
              $scope.library.node_label_index.Profile.sort((a,b)=>{
                if($scope.library.outgoing_nodes.author[a] && $scope.library.outgoing_nodes.author[b]){
                  let node_a = $scope.library.nodes[a];
                  let node_b = $scope.library.nodes[b];
                  let author_uuid_a = $scope.library.outgoing_nodes.author[a][0];
                  let author_uuid_b = $scope.library.outgoing_nodes.author[b][0];
                  if(author_uuid_a == $rootScope.Person.properties.uuid) return 0;
                  else return 1;
                }
              })
            }
        }).catch(function (err) {
            $scope.Getting = false;
            // Alert.note(err.message);
        });

    //Set actions alowed in this controller
    $scope.PopEditModal = (data) => PopProfileEditModal(data, $uibModal, () => $state.reload());
    $scope.PopCreateModal = (data) => PopProfileCreateModal(data, $uibModal, () => $state.reload());
    $scope.PopConnectModal = (data) => PopProfileConnectModal(data, $uibModal);
    $scope.PopAttendeeModal = (data) => PopProfileAttendeeModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopProfileOverviewModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopProfileQuickReportModal(data, $uibModal);
    $scope.ViewReport = function (item) {
        $state.go("reports.profile", { uuid: item });
    }
}


function profileAttendeeCtrl($scope, Alert, $http,sweetAlert, $rootScope, $uibModal, ProfileAPI, GraphJS) {
    //Get Profiles
    $scope.Getting = true;
    $scope.search = '';

    ProfileAPI.GetAttendeeProfiles($rootScope.Person.properties.uuid)
        .then(function (profiles) {
            $scope.Getting = false;
            $scope.library = profiles;
        }).catch(function (err) {
            $scope.Getting = false;
            // Alert.note(err.message)
        });
}



function connectProfileCtrl($scope, sweetAlert, Alert, GraphJS, ProfileAPI, SharedAPI, $uibModalInstance, profile_uuid) {
    $scope.cancel = function () {
        $uibModalInstance.close();
    }
    //Ordered subscriber types
    $scope.sorted_types = [{
        "label": "Attribute",
        "type": "profile_attributes"
    }, {
        "label": "Interaction",
        "type": "profile_interactions"
    }]

    $scope.Getting = true;
    ProfileAPI.GetProfileConnections(profile_uuid).then(function (result) {
        $scope.Getting = false;
        $scope.initial_profile_connections = JSON.parse(JSON.stringify(result));
        $scope.profile_connections = result;

        $scope.sorted_types.forEach((it) => {
            if ($scope.profile_connections.node_label_index[it.label]) {
                $scope.profile_connections.node_label_index[it.label].sort((a, b) => {
                    let rel_id_a = $scope.profile_connections.incoming[it.type][a][0];
                    let rel_id_b = $scope.profile_connections.incoming[it.type][b][0];
                    let rel_a = $scope.profile_connections.rels[rel_id_a];
                    let rel_b = $scope.profile_connections.rels[rel_id_b];
                    return rel_a.properties.order - rel_b.properties.order;
                })
            }
        })
    })

    $scope.submit = function () {
        $scope.posting = true;
        $scope.sorted_types.forEach((it) => {
            for (let i = 0; i < $scope.profile_connections.node_label_index[it.label].length; i++) {
                let node_id = $scope.profile_connections.node_label_index[it.label][i];
                let rel_id = $scope.profile_connections.incoming[it.type][node_id][0];
                let rel = $scope.profile_connections.rels[rel_id];
                rel.properties.order = i;
            }
        })
        ProfileAPI.SetProfileConnections({
            initial: $scope.initial_profile_connections,
            revised: $scope.profile_connections
        }).then(function () {
            sweetAlert.swal({
                title: "Success!",
                text: "Your profile will be available to all systems soon",
                type: "success",
            }, function (isConfirm) {
                $uibModalInstance.close();
            });
        }).catch(function (err) {
            Alert.note(err.message)
        });
    }
};

function inviteProfileCtrl($scope, sweetAlert, Alert, GraphJS, ProfileAPI, $uibModalInstance, profile_uuid) {
    $scope.cancel = function () {
        $uibModalInstance.close();
    }

    $scope.Getting = true;
    ProfileAPI.GetProfileInvitees(profile_uuid).then(function (result) {
        $scope.Getting = false;
        $scope.initial_profile_connections = JSON.parse(JSON.stringify(result));
        $scope.profile_connections = result;
    })

    $scope.submit = function () {
        $scope.posting = true;
        ProfileAPI.SetProfileConnections({
            initial: $scope.initial_profile_connections,
            revised: $scope.profile_connections
        }).then(function () {
            sweetAlert.swal({
                title: "Success!",
                text: "Your profile will be available to all systems soon",
                type: "success",
            }, function (isConfirm) {
                $uibModalInstance.close();
            });
        }).catch(function (err) {
            Alert.note(err.message)
        });
    }
};


function profileQuickReportCtrl($scope, $uibModal, notify, sweetAlert, ProfileWorkshopAPI, GraphJS, profile_uuid) {
    $scope.subgraph = {};
    $scope.sorted_types = [{
        "label": "Attribute",
        "type": "profile_attributes"
    }, {
        "label": "Interaction",
        "type": "profile_interactions"
    }]

    ProfileWorkshopAPI.SyncProfileWorkshop(profile_uuid).then((response) => {
        $scope.subgraph = response;
        //Sort incoming attributes and interactions by Order props
        $scope.sorted_types.forEach((it) => {
            if ($scope.subgraph.node_label_index[it.label]) {
                $scope.subgraph.node_label_index[it.label].sort((a, b) => {
                    if (!$scope.subgraph.outgoing[it.type][a] || !$scope.subgraph.outgoing[it.type][b]) return;
                    let rel_id_a = $scope.subgraph.outgoing[it.type][a][0];
                    let rel_id_b = $scope.subgraph.outgoing[it.type][b][0];

                    let rel_a = $scope.subgraph.rels[rel_id_a];
                    let rel_b = $scope.subgraph.rels[rel_id_b];
                    return rel_a.properties.order - rel_b.properties.order;
                })
            }
        })

        //Score each Note by importance and pain
        if ($scope.subgraph.node_label_index.Note) {
            $scope.subgraph.node_label_index.Note.forEach(function (node_uuid) {
                let note_a = $scope.subgraph.nodes[node_uuid];
                let count_a = 0;
                let pain_a = 0;
                if ($scope.subgraph.incoming["pain"]) {
                    if ($scope.subgraph.incoming['pain'][note_a.properties.uuid]) pain_a += $scope.subgraph.incoming['pain'][note_a.properties.uuid].length;
                }
                if ($scope.subgraph.incoming["vote"]) {
                    if ($scope.subgraph.incoming['vote'][note_a.properties.uuid]) count_a += $scope.subgraph.incoming['vote'][note_a.properties.uuid].length;
                }

                note_a.properties.Importance = count_a;
                note_a.properties.Pain = pain_a;
            })
        }


        //Isolate Attributes
        $scope.ProfileAttributes = $scope.subgraph.node_label_index.Attribute.map((item) => {
            let attribute = $scope.subgraph.nodes[item];
            return attribute;
        });
        //Compute Notes of each attribute
        $scope.ProfileAttributes.forEach((attribute) => {
            attribute.notes = [];
            if ($scope.subgraph.incoming.note_attribute[attribute.properties.uuid]) {
                attribute.notes = $scope.subgraph.incoming.note_attribute[attribute.properties.uuid].map((rel_uuid) => {
                    return $scope.subgraph.rels[rel_uuid].from_id;
                });
            }
        })

        //Isolate Interactions
        $scope.ProfileInteractions = $scope.subgraph.node_label_index.Interaction.map((item) => {
            let interaction = $scope.subgraph.nodes[item];
            return interaction;
        });
        //Compute Notes of each interaction
        $scope.ProfileInteractions.forEach((interaction) => {
            if ($scope.subgraph.incoming.note_interaction[interaction.properties.uuid]) {
                interaction.notes = $scope.subgraph.incoming.note_interaction[interaction.properties.uuid].map((rel_uuid) => {
                    return $scope.subgraph.rels[rel_uuid].from_id;
                });
            }
        })
        //Add a Ref-Safe clone of each interaction into each attribute.
        $scope.ProfileAttributes.forEach((attribute) => {
            attribute.Interactions = [];
            $scope.ProfileInteractions.forEach((interaction) => {
                //Copy Interaction and make copies of its Note array to be sorted independantly
                let interaction_clone = JSON.parse(JSON.stringify(interaction));
                interaction_clone.ImportantNotes = JSON.parse(JSON.stringify(interaction_clone.notes || []));
                interaction_clone.PainfulNotes = JSON.parse(JSON.stringify(interaction_clone.notes || []));

                interaction_clone.ImportantNotes = interaction_clone.ImportantNotes.filter(n => ~attribute.notes.indexOf(n));
                interaction_clone.PainfulNotes = interaction_clone.PainfulNotes.filter(n => ~attribute.notes.indexOf(n));

                interaction_clone.ImportantNotes.sort((a, b) => {
                    let note_a = $scope.subgraph.nodes[a];
                    let note_b = $scope.subgraph.nodes[b];

                    let val_a = note_a.properties.Importance || 0;
                    let val_b = note_b.properties.Importance || 0;

                    return val_b - val_a;
                })

                interaction_clone.PainfulNotes.sort((a, b) => {
                    let note_a = $scope.subgraph.nodes[a];
                    let note_b = $scope.subgraph.nodes[b];

                    let val_a = note_a.properties.Pain || 0;
                    let val_b = note_b.properties.Pain || 0;


                    return val_b - val_a;
                })
                attribute.Interactions.push(interaction_clone);
            })
        })
    })
}
