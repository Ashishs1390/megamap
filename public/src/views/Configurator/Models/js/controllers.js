function nodeTenantCtrl($scope, $stateParams, Alert, $uibModal, NodeAPI, GraphJS, $state, loader, $http, $uibModal) {
    $scope.Getting = "Loading nodes, please wait...";
    $scope.search = '';
    $scope.label = $stateParams.label.charAt(0).toUpperCase() + $stateParams.label.slice(1);
    loader.setValue(5);
    NodeAPI.GetAll($scope.label)
        .then(function (nodes) {
            $scope.Getting = false;
            $scope.library = nodes;
            loader.setValue(100);
        }).catch(function (err) {
            $scope.Getting = false;
            Alert.note(err.message);
        });
    $scope.Focus = function (uuids) {
        $state.go("model.focus", { or_ids: uuids })
    }

    $scope.getStageDescriptions = function(uuid, desc) {
      $http.get('/api/stage/descriptions/'+uuid)
      .then(function(resp) {
        if(resp.status === 200) {
          var modalInstance = $uibModal.open({
            templateUrl: 'views/Configurator/Models/_stage_descriptions.html',
            backdrop: 'static',
            controller: function($scope, $uibModalInstance) {
              $scope.default = desc;
              $scope.descriptions = resp.data;
              $scope.close = function() {
                $uibModalInstance.close(null)
              }
            },
            keyboard: false
          });
          modalInstance.result.then(function(data) {
          }, function() {
            $log.info('Modal dismissed at: ' + new Date());
          });

        }
      }).catch(function(err) {
        console.error(err);
      })
    }

    //Set Controller accessible Modals
    $scope.PopEditModal = (label, data) => PopEditModal(label, data, $uibModal, (success) => $state.reload());
    $scope.PopCreateModal = (data) => PopCreateModal(data, $uibModal, (success) => $state.reload());
    $scope.PopConnectModal = (data) => PopConnectModal(data, $uibModal);
    $scope.PopConnectPersonaModal = (data) => PopConnectPersonaModal(data, $uibModal);
    $scope.PopAttendeeModal = (data) => PopAttendeeModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
}

function nodeAdminCtrl($scope, $stateParams, Alert, $uibModal, NodeAPI, GraphJS, $state, $interval, $timeout, $http, $uibModal) {
    $scope.Getting = "Loading nodes, please wait...";;
    $scope.search = '';
    $scope.label = $stateParams.label.charAt(0).toUpperCase() + $stateParams.label.slice(1);
    $scope.progress = 5;
    $scope.loader = $interval(() => { if ($scope.progress < 75) { $scope.progress += Math.floor(Math.random() * 25 - 5); } else { $interval.cancel($scope.loader); } }, 100)
    NodeAPI.GetAll($scope.label)
        .then(function (nodes) {
            $scope.Getting = false;
            $scope.library = nodes;
            $scope.progress = 100;
            $timeout(() => { $scope.progress = undefined }, 3000);
        }).catch(function (err) {
            $scope.Getting = false;
            $scope.progress = 10;
            Alert.note(err.message);
        });

        $scope.getStageDescriptions = function(uuid, desc) {
          $http.get('/api/stage/descriptions/'+uuid)
          .then(function(resp) {
            if(resp.status === 200) {
              var modalInstance = $uibModal.open({
                templateUrl: 'views/Configurator/Models/_stage_descriptions.html',
                backdrop: 'static',
                controller: function($scope, $uibModalInstance) {
                  $scope.default = desc;
                  $scope.descriptions = resp.data;
                  $scope.close = function() {
                    $uibModalInstance.close(null)
                  }
                },
                keyboard: false
              });
              modalInstance.result.then(function(data) {
              }, function() {
                $log.info('Modal dismissed at: ' + new Date());
              });

            }
          }).catch(function(err) {
            console.error(err);
          })
        }

    //Set Controller accessible Modals
    $scope.PopEditModal = (label, data) => PopEditModal(label, data, $uibModal, (success) => $state.reload());
    $scope.PopCreateModal = (data) => PopCreateModal(data, $uibModal, (success) => $state.reload());
    $scope.PopConnectModal = (data) => PopConnectModal(data, $uibModal);
    $scope.PopConnectPersonaModal = (data) => PopConnectPersonaModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.cancel = function () {
        $uibModal.close();
    }
}



function nodeAttendeeCtrl($scope, $stateParams, sweetAlert, $uibModal, NodeAPI, GraphJS, $interval, $timeout) {
    $scope.search = '';
    $scope.label = $stateParams.label.charAt(0).toUpperCase() + $stateParams.label.slice(1);
    $scope.progress = 5;
    $scope.loader = $interval(() => { if ($scope.progress < 75) { $scope.progress += Math.floor(Math.random() * 25 - 5); } else { $interval.cancel($scope.loader); } }, 100);
    NodeAPI.GetAll($scope.label)
        .then(function (nodes) {
            $scope.library = nodes;
            $scope.progress = 100;
            $timeout(() => { $scope.progress = undefined }, 3000);
        }).catch(function (err) {
            $scope.progress = 10;

            $scope.Getting = false;
            sweetAlert.swal({
                title: "Error!",
                text: "Error while Loading Library data. " + err.message,
                type: "error"
            });
        });
}

function nodeOverviewCtrl($scope, $uibModalInstance, notify, sweetAlert, NodeAPI, GraphJS, uuid) {
    $scope.subgraph = {};
    $scope.uuid = uuid;
    NodeAPI.GetLocalSubGraph(uuid).then((response) => {
        $scope.subgraph = response;
    })
    $scope.cancel = function (label) {
      $uibModalInstance.close();
        if (label == ('Profile' || 'Workshop')) {
            $uibModalInstance.close();
        }
        return;
    }
}


function nodeConnectCtrl($scope, $uibModalInstance, notify, Alert, sweetAlert, NodeAPI, GraphJS, uuid) {
    $scope.uuid = uuid;
    $scope.cancel = function () {
        $uibModalInstance.close();
    }
    //Ordered subscriber types
    $scope.sorted_types = [{
        "label": "Audience",
        "type": "segment_audiences"
    }]

    $scope.Getting = "Loading nodes, please wait...";;
    NodeAPI.GetSegmentConnections(uuid).then(function (result) {
        $scope.Getting = false;
        $scope.initial_segment_connections = JSON.parse(JSON.stringify(result));
        console.log($scope.initial_segment_connections);
        $scope.segment_connections = result;

        $scope.sorted_types.forEach((it) => {
            if ($scope.segment_connections.node_label_index[it.label]) {
                $scope.segment_connections.node_label_index[it.label].sort((a, b) => {
                    let rel_id_a = $scope.segment_connections.incoming[it.type][a][0];
                    let rel_id_b = $scope.segment_connections.incoming[it.type][b][0];
                    let rel_a = $scope.segment_connections.rels[rel_id_a];
                    let rel_b = $scope.segment_connections.rels[rel_id_b];
                    return rel_a.properties.order - rel_b.properties.order;
                })
            }
        })
    })

    $scope.submit = function () {
        $scope.posting = true;
        $scope.sorted_types.forEach((it) => {
            for (let i = 0; i < $scope.segment_connections.node_label_index[it.label].length; i++) {
                let node_id = $scope.segment_connections.node_label_index[it.label][i];
                let rel_id = $scope.segment_connections.incoming[it.type][node_id][0];
                let rel = $scope.segment_connections.rels[rel_id];
                rel.properties.order = i;
            }
        })
        NodeAPI.SetSegmentConnections({
            initial: $scope.initial_segment_connections,
            revised: $scope.segment_connections
        }).then(function () {
            sweetAlert.swal({
                title: "Success!",
                text: "Segment relationship(s) assigned successfully",
                type: "success",
            }, function (isConfirm) {
                $uibModalInstance.close();
            });
        }).catch(function (err) {
            Alert.note(err.message);
        });
    }
}

function nodePersonaConnectCtrl($scope, $uibModalInstance, notify, sweetAlert, NodeAPI, GraphJS, uuid) {
    $scope.uuid = uuid;
    $scope.cancel = function () {
        $uibModalInstance.close();
    }
    //Ordered subscriber types
    $scope.sorted_types = [{
        "label": "Audience",
        "type": "persona_audiences"
    }]

    $scope.Getting = "Loading nodes, please wait...";;
    NodeAPI.GetPersonaConnections(uuid).then(function (result) {
        $scope.Getting = false;
        $scope.initial_persona_connections = JSON.parse(JSON.stringify(result));
        console.log($scope.initial_persona_connections);
        $scope.persona_connections = result;

        $scope.sorted_types.forEach((it) => {
            if ($scope.persona_connections.node_label_index[it.label]) {
                $scope.persona_connections.node_label_index[it.label].sort((a, b) => {
                    let rel_id_a = $scope.persona_connections.incoming[it.type][a][0];
                    let rel_id_b = $scope.persona_connections.incoming[it.type][b][0];
                    let rel_a = $scope.persona_connections.rels[rel_id_a];
                    let rel_b = $scope.persona_connections.rels[rel_id_b];
                    return rel_a.properties.order - rel_b.properties.order;
                })
            }
        })
    })

    $scope.submit = function () {
        $scope.posting = true;
        $scope.sorted_types.forEach((it) => {
            for (let i = 0; i < $scope.persona_connections.node_label_index[it.label].length; i++) {
                let node_id = $scope.persona_connections.node_label_index[it.label][i];
                let rel_id = $scope.persona_connections.incoming[it.type][node_id][0];
                let rel = $scope.persona_connections.rels[rel_id];
                rel.properties.order = i;
            }
        })
        NodeAPI.SetPersonaConnections({
            initial: $scope.initial_persona_connections,
            revised: $scope.persona_connections
        }).then(function () {
            sweetAlert.swal({
                title: "Success!",
                text: "Persona relationship(s) assigned successfully",
                type: "success",
            }, function (isConfirm) {
                $uibModalInstance.close();
            });
        }).catch(function (err) {
            sweetAlert.swal({
                title: "Error!",
                text: err.message,
                type: "error"
            });
        });
    }
}


function focusNodeCtrl($scope, NodeAPI, GraphJS, $stateParams, $state, $uibModal) {
    $scope.subgraph = {};
    $scope.or_ids = $stateParams.or_ids ? $stateParams.or_ids.split(',') : [];
    $scope.and_ids = $stateParams.and_ids ? $stateParams.and_ids.split(',') : [];
    $scope.ViewModes = ["Neighbors", "Relations"];

    NodeAPI.GetSubGraphs($scope.or_ids).then((response) => {
        $scope.subgraph = response;
        $scope.focused = $scope.or_ids.map((uuid) => $scope.subgraph.nodes[uuid]);
        $scope.SetViewMode($stateParams.view_mode ? $stateParams.view_mode : $scope.ViewModes[0]);
    })

    $scope.SetViewMode = function (mode) {
        $scope.view_mode = mode;
        if ($scope.view_mode == $scope.ViewModes[0]) { $scope.SetViewNeighbors($stateParams.node_label || $scope.subgraph.labels[0]); }
        if ($scope.view_mode == $scope.ViewModes[1]) { $scope.SetViewRels($stateParams.rel_type || $scope.subgraph.rel_types[0]); }
        $state.go('model.focus', { view_mode: mode }, { notify: false });
    }

    $scope.SetViewNeighbors = function (label) {
        $scope.node_label = label;
        $scope.uuids = ($scope.subgraph.node_label_index[label] || []);
        $state.go('model.focus', { node_label: label }, { notify: false })
    }

    $scope.SetViewRels = function (label) {
        $scope.rel_type = label;
        $scope.uuids = [];
        $scope.or_ids.forEach((uuid) => {
            $scope.uuids = $scope.uuids.concat(($scope.subgraph.outgoing_nodes[label][uuid] || []).concat($scope.subgraph.incoming_nodes[label][uuid] || []))
        });
        $scope.uuids = $scope.uuids.filter(function (item, index, inputArray) {
            return inputArray.indexOf(item) == index;
        });
        $state.go('model.focus', { rel_type: label }, { notify: false })
    }
    $scope.PopEditModal = (label, data) => PopEditModal(label, data, $uibModal, () => $state.reload());

    $scope.Center = function (uuid) {
        $state.go("model.focus", { or_ids: [uuid] })
    }
    $scope.OR = function (uuid) {
        $scope.or_ids.push(uuid);
        $state.go("model.focus", { or_ids: $scope.or_ids.join(",") })
    }
    $scope.AND = function (uuid) {
        $scope.and_ids.push(uuid);
        $state.go("model.focus", { and_ids: $scope.and_ids.join(",") })
    }
    $scope.RemoveOr = function (uuid) {
        let i = $scope.or_ids.indexOf(uuid);
        if (i > -1) {
            $scope.or_ids.splice(i, 1)
            $state.go("model.focus", { or_ids: $scope.or_ids.join(",") })
        }
    }
    $scope.RemoveAnd = function (uuid) {
        let i = $scope.and_ids.indexOf(uuid);
        if (i > -1) {
            $scope.and_ids.splice(i, 1)
            $state.go("model.focus", { and_ids: $scope.and_ids.join(",") })
        }
    }

}
function focusCardCtrl($scope) {

}
function connectorCardCtrl($scope) {

}
function searchCardCtrl($scope) {

}

function connectorCtrl($scope, NodeAPI, GraphJS, $stateParams, $state, $uibModal) {
    $scope.from_id = $stateParams.from_id;
    $scope.to_id = $stateParams.to_id;


    $scope.rel_type = $stateParams.rel_type;


    $scope.from_search_label = $stateParams.from_search_label;
    $scope.to_search_label = $stateParams.to_search_label;

    $scope.from_search_term = $stateParams.from_search_term;
    $scope.to_search_term = $stateParams.to_search_term;

    $scope.rel = {};
    $scope.from_subgraph = {};
    $scope.to_subgraph = {};

    $scope.master_labels = ["Note", "Idea", "Milestone", "Project", "Interaction", "Stage", "Person", "Journey", "Persona", "Profile", "Capability", null];



    $scope.FindRels = function () {
        NodeAPI.GetRelationsOfType($scope.from_id, $scope.rel_type, $scope.to_id).then((result) => {
            $scope.result_subgraph = result;
        })
    }
    $scope.FindRels();


    $scope.search = function (dir, term) {
        let label_prop = dir + "_search_label";
        let where_key_prop = dir + "_where_key";
        let where_val_prop = dir + "_where_val";
        let where_type_prop = dir + "_where_type";
        let subgraph_prop = dir + "_subgraph";

        NodeAPI.GetAllNodesByLabelWhere($scope[label_prop], $scope[where_key_prop] || "title", term, $scope[where_type_prop] || "string").then((response) => {
            $scope[subgraph_prop] = response;
        })
    }

    $scope.Select = function (dir, uuid) {
        let id_prop = dir + "_id";
        let subgraph_prop = dir + "_subgraph";
        let params = {};
        params[id_prop] = uuid;
        $scope[id_prop] = uuid;
        if($scope[subgraph_prop] && $scope[subgraph_prop].nodes) {
            $scope[dir] = $scope[subgraph_prop].nodes[uuid];
        }else{
            $scope[dir] = undefined;
        }
        $state.go("model.connector", params, { notify: false })
        $scope.FindRels();
    }
    $scope.SetSearchLabel = function (dir, search_label) {
        let prop_name = dir + "_search_label";
        $scope[prop_name] = search_label;
        let params = {};
        params[prop_name] = search_label;
        $state.go("model.connector", params, { notify: false })
    }
    $scope.SetSearchTerm = function (dir, search_term) {
        console.log(search_term);
        let prop_name = dir + "_search_term";
        $scope[prop_name] = search_term;
        let params = {};
        params[prop_name] = search_term;
        $state.go("model.connector", params, { notify: false })
    }
    $scope.submit = function () {
        $scope.posting = true;
        NodeAPI.Relate({ from_id: $scope.from_id, to_id: $scope.to_id, rel_type: $scope.rel_type, properties: $scope.rel }).then((result) => {
            $state.reload();
        }).catch(() => {
            $scope.posting = false;
        })
    }

    if ($scope.to_id ) {
        NodeAPI.GetAllNodesByLabelWhere(null, "uuid", $scope.to_id, "string").then((response) => {
            $scope.to = response.nodes[response.node_label_index[response.labels[0]][0]];
        });
    }
    if ($scope.from_id) {
        NodeAPI.GetAllNodesByLabelWhere(null, "uuid", $scope.from_id, "string").then((response) => {
            $scope.from = response.nodes[response.node_label_index[response.labels[0]][0]];
        })
    }


    if ($scope.from_search_label || $scope.from_search_term) {
        $scope.search("from",$scope.from_search_term );
    }
    if ($scope.to_search_label || $scope.to_search_term) {
        $scope.search("to",$scope.to_search_term );
    }

    $scope.FindRels();

}
