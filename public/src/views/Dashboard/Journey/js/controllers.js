function journeyTenantCtrl(Activity, $scope, $http, Alert, $rootScope, $uibModal, JourneyAPI, GraphJS, $state, DynamicJourneyFields) {
    //Get Local Library
    $scope.search = '';
    $scope.Getting = true;
    getData();


    // Set Controller accessible Modals
    $scope.PopEditModal = (data) => PopJourneyEditModal(data, DynamicJourneyFields, $uibModal, () => $state.reload());
    $scope.PopCreateModal = (data) => PopJourneyCreateModal(data, DynamicJourneyFields, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopConnectModal = (data) => PopJourneyConnectModal(data, $uibModal);
    $scope.PopAttendeeModal = (data) => PopJourneyAttendeeModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopJourneyQuickReportModal(data, $uibModal);

    $scope.ViewReport = function (item) {
        $state.go("reports.journey", { uuid: item });
        Activity.log(item, 'view report', 'last_active_at');
    }



    function getData() {
        JourneyAPI.GetTenantJournies("Journey")
            .then(function (journeys) {
                $scope.Getting = false;
                $scope.library = journeys;
                $scope.library.node_label_index.Journey.sort((a, b) => {
                    let node_a = $scope.library.nodes[a];
                    let node_b = $scope.library.nodes[b];
                    let author_uuid_a = $scope.library.outgoing_nodes.author[a][0];
                    let author_uuid_b = $scope.library.outgoing_nodes.author[b][0];
                    if (author_uuid_a == $rootScope.Person.properties.uuid) return 0;
                    else return 1;
                })
            }).catch(function (err) {
                $scope.Getting = false;
                Alert.note(err.message);
            });
    }

}

function journeyAdminCtrl(Activity, $scope, $http, Alert, $rootScope, $uibModal, JourneyAPI, GraphJS, socket, $state, DynamicJourneyFields, socket,$rootScope) {
    //Get Journeys for this controller
    $scope.search = '';
    $scope.Getting = true;
    getData();

    let Socket = socket($scope);
    Socket.connect('Journey');
    Socket.on("post.node", (socketData) => {
        console.log('after socket for journey:' + JSON.stringify(socketData));
        getData();
    });

    //Set actions alowed in this controller
    $scope.PopEditModal = (data) => PopJourneyEditModal(data, DynamicJourneyFields, $uibModal, () => $state.reload());
    $scope.PopCreateModal = (data) => PopJourneyCreateModal(data, DynamicJourneyFields, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopConnectModal = (data) => PopJourneyConnectModal(data, $uibModal);
    $scope.PopAttendeeModal = (data) => PopJourneyAttendeeModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopJourneyQuickReportModal(data, $uibModal);

    $scope.ViewReport = function (item) {
        $state.go("reports.journey", { uuid: item });
        Activity.log(item, 'view report', 'last_active_at');
    }

    function getData() {
        JourneyAPI.GetAdminJournies($rootScope.Person.properties.uuid)
            .then(function (journeys) {
                $scope.Getting = false;
                $scope.library = journeys;
                $scope.library.node_label_index.Journey.sort((a, b) => {
                    let node_a = $scope.library.nodes[a];
                    let node_b = $scope.library.nodes[b];
                    let author_uuid_a = $scope.library.outgoing_nodes.author[a][0];
                    let author_uuid_b = $scope.library.outgoing_nodes.author[b][0];
                    if (author_uuid_a == $rootScope.Person.properties.uuid) return 0;
                    else return 1;
                })
            }).catch(function (err) {
                $scope.Getting = false;
                Alert.note(err.message)
            });
    }
}



function journeyAttendeeCtrl(Activity, $scope, $http, Alert, $rootScope, $uibModal, JourneyAPI, GraphJS, $state) {
    //Get Journeys
    $scope.search = '';
    $scope.Getting = true;
    getData();

    $scope.PopQuickReportModal = (data) => PopJourneyQuickReportModal(data, $uibModal);

    $scope.ViewReport = function (item) {
        $state.go("reports.journey", { uuid: item });
        Activity.log(item, 'view report', 'last_active_at');
    }

    function getData() {
        JourneyAPI.GetAttendeeJournies($rootScope.Person.properties.uuid)
            .then(function (journeys) {
                $scope.Getting = false;
                $scope.library = journeys;
            }).catch(function (err) {
                $scope.Getting = false;
                Alert.note(err.message)
            });

    }
}



function connectJourneyCtrl($scope, $state, $rootScope, sweetAlert, Alert, GraphJS, JourneyAPI, SharedAPI, $uibModalInstance, journey_uuid) {
    $scope.cancel = function () {
        $uibModalInstance.close();
    }
    $scope.setOrders = {};
    $scope.getOrders = function (arr, label) {
        console.log(arr, label)
        $scope.setOrders[label] = arr;
    }
    $scope.sorted_types = [{
        "label": "Stage",
        "type": "journey_stages"
    }, {
        "label": "Interaction",
        "type": "journey_interactions"
    }, {
        "label": "Persona",
        "type": "journey_persona"
    }]

    $scope.Getting = true;
    $rootScope.journey__uuid = journey_uuid;
    var getNodesWithouNotes = true; // this flag is added as we dont want notes in API response on component click
    JourneyAPI.GetJourneyConnections(journey_uuid ,getNodesWithouNotes).then(function (result) {
        $scope.Getting = false;
        $scope.initial_journey_connections = JSON.parse(JSON.stringify(result));
        $scope.journey_connections = result;
        $rootScope.stagedDataAttendee = result;

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
        })
    })


    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopQuickReportModal = (data) => PopJourneyQuickReportModal(data, $uibModal);

    $scope.submit = function () {
        $scope.posting = true;
        $scope.sorted_types.forEach((it) => {
            if($scope.journey_connections.node_label_index[it.label]) {
                for (let i = 0; i < $scope.journey_connections.node_label_index[it.label].length; i++) {
                    let node_id = $scope.journey_connections.node_label_index[it.label][i];
                    let rel_id = $scope.journey_connections.incoming[it.type][node_id][0];
                    let rel = $scope.journey_connections.rels[rel_id];
                    rel.properties.order = i;
                }
            }
        })

        JourneyAPI.SetJourneyConnections({
            initial: $scope.initial_journey_connections,
            revised: $scope.journey_connections
        }).then(function () {
            sweetAlert.swal({
                title: "Success!",
                text: "Your journey will be available to all systems soon",
                type: "success",
            }, function (isConfirm) {
                $uibModalInstance.close();
                $state.reload();
            });
        }).catch(function (err) {
            Alert.note(err.message)
        });
    }
};



function inviteJourneyCtrl($scope,$rootScope,$http ,$timeout,sweetAlert, Alert, GraphJS, JourneyAPI, $uibModalInstance,attendeeDataSubmitService, attendeeDataAddToLocalService,journey, external) {
    $scope.journey_uuid = journey.uuid;
    $rootScope.uuidForAttendee = journey.uuid;
    // $rootScope.$broadcast('journey_event', { jid:journey.uuid })
    $scope.journey = journey;
    $scope.external = external;
    $scope.cancel = function () {
        $uibModalInstance.close();
    }

    $rootScope.$on("getAttendee" , function(event , param){
        JourneyAPI.GetJourneyInvitees($scope.journey_uuid, external,param).then(function (result) {
            $scope.Getting = false;
            $scope.initial_journey_connections = JSON.parse(JSON.stringify(result));
            $scope.journey_connections = result;
            $rootScope.stagedDataAttendee = result;
            $rootScope.$broadcast('journeyevent', { result:result })

        })
    })

    $scope.Getting = false;
    $scope.submit = function () {
        var poolData = document.getElementsByClassName('poolData');
        delete poolData.length;

        for (const property in poolData) {
            if(typeof poolData[property] == "object"){
            console.log(poolData[property]);
            poolData[property].style.display = 'none';
            }
        }

        let users = {};
        let removeFromLocalData = attendeeDataSubmitService.getData();
        let addToLocalData = attendeeDataAddToLocalService.getData();
        if(removeFromLocalData.length > 0 || addToLocalData.length > 0 ){
            if(removeFromLocalData.length > 0){
                JourneyAPI.PostRemoveLocal({removeFromLocalData},$scope.journey.uuid).then(function(resp){
                    sweetAlert.swal({
                title: "Success!",
                text: "Your journey will be available to all systems soon",
                type: "success",
                }, function (isConfirm) {
                    $uibModalInstance.close(resp.data);
                });
                })
            }
            if(addToLocalData.length > 0){
                let attendees = addToLocalData.map(function(localData){
                    return({email:localData});
                });
                users.uuid= $scope.journey.uuid;
                users.attendees = attendees;
                $http.post('/api/node/bulk/addition', {
                    users: users
                }).then(function (resp) {
                    sweetAlert.swal({
                    title: "Success!",
                    text: "Your journey will be available to all systems soon",
                    type: "success",
                    }, function (isConfirm) {
                        $uibModalInstance.close();
                    });
                })
            }

        } else {

        $scope.posting = true;
        JourneyAPI.SetJourneyConnections({
            initial: $scope.initial_journey_connections,
            revised: $scope.journey_connections
        }).then(function (resp) {
            // console.log(resp);
            sweetAlert.swal({
                title: "Success!",
                text: "Your journey will be available to all systems soon",
                type: "success",
            }, function (isConfirm) {
                $uibModalInstance.close();
            });
        }).catch(function (err) {
            Alert.note(err.message)
        });

        }


    }
};

function journeyQuickReportCtrl($scope, $uibModal, notify, JourneyWorkshopAPI, GraphJS, journey_uuid) {
    // $scope.Getting = true;
    $scope.subgraph = {};
    $scope.sorted_types = [{
        "label": "Stage",
        "type": "journey_stages"
    }, {
        "label": "Interaction",
        "type": "journey_interactions"
    }]

    $scope.Getting = true;
    JourneyWorkshopAPI.SyncJourneyWorkshop(journey_uuid).then((response) => {
        $scope.Getting = false;

        $scope.subgraph = response;
        //Sort incoming stages and interactions by Order props
        $scope.sorted_types.forEach((it) => {
            if ($scope.subgraph.node_label_index && $scope.subgraph.node_label_index[it.label]) {
                $scope.subgraph.node_label_index[it.label].sort((a, b) => {
                    if (!$scope.subgraph.outgoing[it.type][a] || !$scope.subgraph.outgoing[it.type][b]) return;
                    let rel_id_a = $scope.subgraph.outgoing[it.type][a][0];
                    let rel_id_b = $scope.subgraph.outgoing[it.type][b][0];

                    let rel_a = $scope.subgraph.rels[rel_id_a];
                    let rel_b = $scope.subgraph.rels[rel_id_b];
                    return rel_a.properties.order - rel_b.properties.order;
                })
                // console.log($scope.subgraph.node_label_index[it.label])
            }
        })

        //Score each Note by importance and pain
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


        //Isolate Stages
        $scope.JourneyStages = $scope.subgraph.node_label_index.Stage.map((item) => {
            let stage = $scope.subgraph.nodes[item];
            return stage;
        });
        //Compute Notes of each stage
        $scope.JourneyStages.forEach((stage) => {
            stage.notes = [];
            if ($scope.subgraph.incoming.note_stage[stage.properties.uuid]) {
                stage.notes = $scope.subgraph.incoming.note_stage[stage.properties.uuid].map((rel_uuid) => {
                    return $scope.subgraph.rels[rel_uuid].from_id;
                });
            }
        })

        //Isolate Interactions
        $scope.JourneyInteractions = $scope.subgraph.node_label_index.Interaction.map((item) => {
            let interaction = $scope.subgraph.nodes[item];
            return interaction;
        });
        //Compute Notes of each interaction
        $scope.JourneyInteractions.forEach((interaction) => {
            if ($scope.subgraph.incoming.note_interaction[interaction.properties.uuid]) {
                interaction.notes = $scope.subgraph.incoming.note_interaction[interaction.properties.uuid].map((rel_uuid) => {
                    return $scope.subgraph.rels[rel_uuid].from_id;
                });
            }
        })
        //Add a Ref-Safe clone of each interaction into each stage.
        $scope.JourneyStages.forEach((stage) => {
            stage.Interactions = [];
            $scope.JourneyInteractions.forEach((interaction) => {
                //Copy Interaction and make copies of its Note array to be sorted independantly
                let interaction_clone = JSON.parse(JSON.stringify(interaction));
                interaction_clone.ImportantNotes = JSON.parse(JSON.stringify(interaction_clone.notes || []));
                interaction_clone.PainfulNotes = JSON.parse(JSON.stringify(interaction_clone.notes || []));

                interaction_clone.ImportantNotes = interaction_clone.ImportantNotes.filter(n => stage.notes.includes(n));
                interaction_clone.PainfulNotes = interaction_clone.PainfulNotes.filter(n => stage.notes.includes(n));

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
                stage.Interactions.push(interaction_clone);
            })
        })
    })
}
