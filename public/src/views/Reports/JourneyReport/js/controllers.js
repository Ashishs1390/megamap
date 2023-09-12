function journeyReportCtrl($scope, $uibModal, notify, sweetAlert, JourneyWorkshopAPI, GraphJS, $stateParams, $rootScope, $state) {
    $scope.Getting = true;

    $scope.EditMode = true;
    $scope.subgraph = {};
    $scope.sorted_types = [{
        "label": "Stage",
        "type": "journey_stages"
    }, {
        "label": "Interaction",
        "type": "journey_interactions"
    }]


    JourneyWorkshopAPI.SyncJourneyWorkshop($stateParams.uuid).then((response) => {
        $scope.Getting = false;

        $scope.subgraph = response;

        $scope.SelectedJourney = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Journey[0]];
        $scope.SelectedStage = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Stage[0]];
        $scope.SelectedInteraction = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Interaction[0]];
        $scope.SelectedPersona = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Persona[0]];
        $scope.SelectedStrategy = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Strategy[0]];
        $scope.SelectedProduct = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Product[0]];

        //Sort incoming stages and interactions by Order props
        $scope.sorted_types.forEach((it) => {
            if ($scope.subgraph.node_label_index[it.label]) {
                $scope.subgraph.node_label_index[it.label].sort((a, b) => {
                    if (!$scope.subgraph.incoming[it.type][a] || !$scope.subgraph.incoming[it.type][b]) return;
                    let rel_id_a = $scope.subgraph.incoming[it.type][a][0];
                    let rel_id_b = $scope.subgraph.incoming[it.type][b][0];

                    let rel_a = $scope.subgraph.rels[rel_id_a];
                    let rel_b = $scope.subgraph.rels[rel_id_b];
                    return rel_a.properties.order - rel_b.properties.order;
                })
            }
        })

        $scope.SelectedPersona = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Persona[0]];

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


        //Isolate stages
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

                interaction_clone.ImportantNotes = JSON.parse(JSON.stringify(interaction_clone.notes || [])).filter(n => ~stage.notes.indexOf(n));
                interaction_clone.PainfulNotes = JSON.parse(JSON.stringify(interaction_clone.notes || [])).filter(n => ~stage.notes.indexOf(n));

                // Sort imoprtant and painful notes in order
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



                $scope.SortOrders.forEach((item) => {
                    if (item.props) {
                        interaction_clone[item.props + "_notes"] = JSON.parse(JSON.stringify(interaction_clone.notes || [])).filter(n => ~stage.notes.indexOf(n));
                        interaction_clone[item.props + "_notes"].sort((a, b) => {
                            let note_a = $scope.subgraph.nodes[a];
                            let note_b = $scope.subgraph.nodes[b];

                            let val_a = note_a.properties[item.props] || 0;
                            let val_b = note_b.properties[item.props] || 0;

                            return (item.reverse) ? val_a - val_b : val_b - val_a;

                        })
                    }
                });
                stage.Interactions.push(interaction_clone);
            })
        })


        $scope.sortValue = $scope.SortOrders[0];
    })


    $scope.gotoPrevState = function() {
        if ( !$rootScope.previousState.length ) {
            $rootScope.previousState = 'dashboard.journey'
            $state.go($rootScope.previousState)

        } else {
            $state.go($rootScope.previousState, $rootScope.previousParams)
        }
    }





    $scope.SortOrders = [
        { display: "Default", props: null },
        { display: "Average Importance", props: 'average_importance' },
        { display: "Average Effectiveness", props: 'average_effectiveness' },
        { display: "Correlation", props: 'correlation' },
        { display: "Sample Size", props: 'sample_size' },
        { display: "Gap", props: 'gap', reverse: true }
    ];

}
