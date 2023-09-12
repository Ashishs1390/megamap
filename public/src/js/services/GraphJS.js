app.factory('GraphJS', function ($rootScope) { 
  var GraphJS = {

    //Object constructor to generate new nodes with basic properties set
    Node(label, title, uuid) {
      let node = {};
      if (Object.prototype.toString.call(label) === '[object Array]') {
        //label is an array
        node.labels = label;
      } else {
        //label is not array (treat as string)
        node.labels = [label];
      }
      node.properties = {};
      node.properties.title = title;
      if (uuid) node.properties.uuid = uuid;
      return node;
    },

    Rel(type, uuid) {
      let rel = {};
      rel.type = type;
      rel.properties = {};
      if (uuid) rel.properties.uuid = uuid;
      return rel;
    },
    //Should return a new object showing Elements
    Differences: function (SubGraph1, SubGraph2) {
      let SG1 = JSON.parse(JSON.stringify(SubGraph1));
      this.SubtractSubGraphs(SG1, SubGraph2);

      let SG2 = JSON.parse(JSON.stringify(SubGraph2));
      this.SubtractSubGraphs(SG2, SubGraph1);

      let Updates = this.FindUpdates(SubGraph1, SubGraph2);

      return {
        Extra: SG2,
        Missing: SG1,
        Updated: Updates
      };
    },

    FindUpdates: function (SubGraph1, SubGraph2) {
      let Updates = {
        nodes: {
          updated: {},
          new: {},
          missing: {}
        },
        rels: {
          updated: {},
          new: {},
          missing: {}
        }
      };

      ["nodes", "rels"].forEach((it) => {
        if (!SubGraph2[it] || !SubGraph1[it]) return;
        let keys = Object.keys(SubGraph2[it]);
        for (let key_index in keys) {
          let key = keys[key_index];
          if (SubGraph1[it][key]) {
            let node_1 = SubGraph1[it][key];
            let node_2 = SubGraph2[it][key];

            //Iterate props of 1 to find things missing in 2, Also, compare all props which are shared
            let prop_keys_1 = Object.keys(node_1.properties);
            prop_keys_1.forEach((key) => {
              if (node_2.properties[key] == null) {
                if (!Updates[it].missing[key]) Updates[it].missing[key] = [];
                Updates[it].missing[key].push(node_2.properties.uuid);
              } else {
                //1 and 2 share the property, is it equal?
                let prop_1 = node_1.properties[key];
                let prop_2 = node_2.properties[key];
                if (prop_1 != prop_2) {
                  if (!Updates[it].updated[key]) Updates[it].updated[key] = [];
                  Updates[it].updated[key].push(node_2.properties.uuid);
                }
              }
            })

            //Iterate props of 2 to find new things since 1
            let prop_keys_2 = Object.keys(node_2.properties);
            prop_keys_2.forEach((key) => {
              if (node_1.properties[key] == null) {
                if (!Updates[it].new[key]) Updates[it].new[key] = [];
                Updates[it].new[key].push(node_1.properties.uuid);
              }
            })
          }
        }
      })

      return Updates;
    },

    RebuildIndexes: function (SubGraph) {
      if (SubGraph.nodes) {
        //SubGraph.node_label_index = {};
        SubGraph.labels = [];
          Object.keys(SubGraph.nodes).forEach((key) => {
            let node = SubGraph.nodes[key];
            node.labels.forEach((label) => {
              if (SubGraph.node_label_index && !SubGraph.node_label_index[label]) {
                SubGraph.node_label_index[label] = [];
              }
              if (SubGraph.node_label_index && SubGraph.node_label_index[label].indexOf(node.properties.uuid) == -1) {
                SubGraph.node_label_index[label].push(node.properties.uuid);
              }
              
              if (SubGraph.labels.indexOf(label) == -1) SubGraph.labels.push(label);
            })
          })
      }

      if (SubGraph.rels) {
        SubGraph.rel_types = [];

        SubGraph.rel_label_index = {};
        SubGraph.incoming = {};
        SubGraph.outgoing = {};

        SubGraph.incoming_nodes = {};
        SubGraph.outgoing_nodes = {};


        Object.keys(SubGraph.rels).forEach((key) => {
          let rel = SubGraph.rels[key];
          let label = rel.type;
          if (!SubGraph.rel_label_index[label]) SubGraph.rel_label_index[label] = [];
          if (SubGraph.rel_label_index[label].indexOf(rel.properties.uuid) == -1) SubGraph.rel_label_index[label].push(rel.properties.uuid);
          if (SubGraph.rel_types.indexOf(label) == -1) SubGraph.rel_types.push(label);

          if (!SubGraph.incoming[label]) SubGraph.incoming[label] = {};
          if (!SubGraph.incoming[label][rel.to_id]) SubGraph.incoming[label][rel.to_id] = [];
          if (SubGraph.incoming[label][rel.to_id].indexOf(rel.properties.uuid) == -1) SubGraph.incoming[label][rel.to_id].push(rel.properties.uuid);

          if (!SubGraph.incoming_nodes[label]) SubGraph.incoming_nodes[label] = {};
          if (!SubGraph.incoming_nodes[label][rel.to_id]) SubGraph.incoming_nodes[label][rel.to_id] = [];
          if (SubGraph.incoming_nodes[label][rel.to_id].indexOf(rel.from_id) == -1) SubGraph.incoming_nodes[label][rel.to_id].push(rel.from_id);


          if (!SubGraph.outgoing[label]) SubGraph.outgoing[label] = {};
          if (!SubGraph.outgoing[label][rel.from_id]) SubGraph.outgoing[label][rel.from_id] = [];
          if (SubGraph.outgoing[label][rel.from_id].indexOf(rel.properties.uuid) == -1) SubGraph.outgoing[label][rel.from_id].push(rel.properties.uuid);

          if (!SubGraph.outgoing_nodes[label]) SubGraph.outgoing_nodes[label] = {};
          if (!SubGraph.outgoing_nodes[label][rel.from_id]) SubGraph.outgoing_nodes[label][rel.from_id] = [];
          if (SubGraph.outgoing_nodes[label][rel.from_id].indexOf(rel.to_id) == -1) SubGraph.outgoing_nodes[label][rel.from_id].push(rel.to_id);

        })
      }
    },

    joinSubGraphs: function (SubGraph1, SubGraph2) {
      //Should merge SG2 into SG1
      var self = this;

      function mergeGraph(keyStr) {
        if (SubGraph2[keyStr]) {
          for (let key in SubGraph2[keyStr]) {
            let val = SubGraph2[keyStr][key];
            SubGraph1[keyStr][key] ? self.merge(SubGraph1[keyStr][key], val) : SubGraph1[keyStr][key] = SubGraph2[keyStr][key];
          }
        }
      }
      mergeGraph("nodes");
      mergeGraph("rels");
      this.RebuildIndexes(SubGraph1);
    },

    MergeRelationship: function (relationship, SubGraph) {
      let rel = relationship;
      if (!SubGraph.rels) SubGraph.rels = {};
      if (!SubGraph.rels[rel.properties.uuid]) SubGraph.rels[rel.properties.uuid] = rel;
      else this.merge(SubGraph.rels[rel.properties.uuid], rel);
      this.RebuildIndexes(SubGraph);
    },


    //Inserts/Updates a collection of nodes into the apps indexed libraries
    MergeNodes: function (nodes, SubGraph) {
      nodes.map((node) => this.MergeNode(node, SubGraph))
    },

    //Inserts a single node into all labeled indexes of given object O as O[label][id]
    MergeNode: function (node, SubGraph) {
      if (!node || !node.properties || !node.labels || !SubGraph) {
        return;
      }
      if (!node.properties.uuid) node.properties.uuid = node.properties.uuid;
      let id = node.properties.uuid;

      if (!SubGraph.nodes) SubGraph.nodes = {};
      if (SubGraph.nodes[id]) this.merge(SubGraph.nodes[id], node)
      else SubGraph.nodes[id] = node;

      this.RebuildIndexes(SubGraph);

    },


    // RemoveNodeFromLocalSubgraph: function (node, SubGraph) {
    //   delete SubGraph.nodes[node.properties.uuid];
    //   let label_index = SubGraph.node_label_index[node.labels[0]]; 
    //   if (label_index.indexOf(node.properties.uuid) != -1)
    //     label_index = label_index.splice(label_index.indexOf(node.properties.uuid), 1);
    // },

    RemoveNodeFromLocalSubgraph: function (node, SubGraph, onSuccess, onError) {
      delete SubGraph.nodes[node.properties.uuid];
      var elemIndex = SubGraph.node_label_index[node.labels[0]].indexOf(node.properties.uuid);
      SubGraph.node_label_index[node.labels[0]].splice(elemIndex, 1); 

      this.CleanStrandedRels(SubGraph);
      this.RebuildIndexes(SubGraph);
    },

    merge: function (obj1, obj2) {
      if (!obj1) obj1 = {};
      for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
    },

    //Removes all Nodes present in SG2 from SG1.
    RemoveNodes: function (SubGraph1, SubGraph2) {
      let node_keys = Object.keys(SubGraph2.nodes);
      for (let key_index in node_keys) {
        let key = node_keys[key_index];
        if (SubGraph1.nodes[key]) {
          let node = SubGraph1.nodes[key];
          for (let i in node.labels) {
            let label = node.labels[i];
            let index = SubGraph1.node_label_index[label].indexOf(node.properties.uuid);
            if (index != -1) SubGraph1.node_label_index[label].splice(index, 1);

            if (SubGraph1.node_label_index[label].length == 0) delete SubGraph1.node_label_index[label];
          }
          delete SubGraph1.nodes[key];
        }
      }
    },

    //Removes all elements present in SG2 from SG1
    CleanStrandedRels: function (SubGraph) {
      if (!SubGraph.rels) return;

      Object.keys(SubGraph.rels).forEach((key) => {
        if (!SubGraph.nodes[SubGraph.rels[key].from_id] || !SubGraph.nodes[SubGraph.rels[key].to_id]) {
          delete SubGraph.rels[key]
        }
      })
    },


    //Removes all rels present in SG2 rom SG1
    RemoveRels: function (SubGraph1, SubGraph2) {
      if (SubGraph2.rels && SubGraph1.rels) {
        let rel_keys = Object.keys(SubGraph2.rels);
        for (let key_index in rel_keys) {
          let key = rel_keys[key_index];
          if (SubGraph1.rels[key]) {
            delete SubGraph1.rels[key];
          }
        }
      }
      this.RebuildIndexes(SubGraph1);
    },

    //Removes all elements present in SG2 from SG1
    SubtractSubGraphs: function (SubGraph1, SubGraph2) {
      this.RemoveNodes(SubGraph1, SubGraph2);
      this.RemoveRels(SubGraph1, SubGraph2);
    },

    MergeRemoteRelationship: function (relationship, SubGraph) {
      //Transform incoming data to proper form

      delete relationship.to_node._id;
      delete relationship.rel._id;
      delete relationship.rel._fromId;
      delete relationship.rel._toId;

      let from_node = relationship.from_node;
      let to_node = relationship.to_node;
      let rel = relationship.rel;
      let label = rel.type;

      rel.from_id = from_node.properties.uuid;
      rel.to_id = to_node.properties.uuid;

      this.MergeNode(from_node, SubGraph);
      this.MergeNode(to_node, SubGraph);

      if (!SubGraph.rels) SubGraph.rels = {};
      if (!SubGraph.rels[rel.properties.uuid]) SubGraph.rels[rel.properties.uuid] = rel;
      else this.merge(SubGraph.rels[rel.properties.uuid], rel);

      if (!SubGraph.rel_label_index) SubGraph.rel_label_index = {};
      if (!SubGraph.rel_label_index[label]) SubGraph.rel_label_index[label] = [];
      if (!SubGraph.rel_label_index[label]) SubGraph.rel_label_index[label][to_node.properties.uuid] = [];
      if (SubGraph.rel_label_index[label].indexOf(rel.properties.uuid) == -1) SubGraph.rel_label_index[label].push(rel.properties.uuid);

      if (!SubGraph.outgoing) SubGraph.outgoing = {};
      if (!SubGraph.outgoing[label]) SubGraph.outgoing[label] = {};
      if (!SubGraph.outgoing[label][from_node.properties.uuid]) SubGraph.outgoing[label][from_node.properties.uuid] = [];
      if (SubGraph.outgoing[label][from_node.properties.uuid].indexOf(rel.properties.uuid) == -1) SubGraph.outgoing[label][from_node.properties.uuid].push(rel.properties.uuid);

      if (!SubGraph.incoming) SubGraph.incoming = {};
      if (!SubGraph.incoming[label]) SubGraph.incoming[label] = {};
      if (!SubGraph.incoming[label][to_node.properties.uuid]) SubGraph.incoming[label][to_node.properties.uuid] = [];
      if (SubGraph.incoming[label][to_node.properties.uuid].indexOf(rel.properties.uuid) == -1) SubGraph.incoming[label][to_node.properties.uuid].push(rel.properties.uuid);
    },


  FindInteractionFromNote: function (note, journeySubGraph) {
     let note_id = note.properties.uuid
     let interaction_rel_id = journeySubGraph.outgoing.note_interaction[note_id][0]
     let rel_to_id = journeySubGraph.rels[interaction_rel_id].to_id
     let to_node_uuid = journeySubGraph.nodes[rel_to_id].properties.uuid

     return {
       note_id: note_id,
       interaction_rel_id: interaction_rel_id,
       rel_to_id: rel_to_id,
       to_node_uuid: to_node_uuid
     }
   },
   //Returns true if Arr1 contains any of the elements in arr2
   CrossReference: function (arr1, arr2) {
     if (!arr1 || !arr2) return false;
     let found = false;
     arr1.forEach(function (element) {
       if (arr2.indexOf(element) != -1) { found = true }
     }, this);
     return found;
   },

   //Returns Ref-Safe new Subgraph
   AND: function (Node1, Dir1, RelType1, Node2, Dir2, RelType2, SubGraph) {
     let ANDSubgraph = {};
     this.MergeNode(JSON.parse(JSON.stringify(Node1)), ANDSubgraph);
     this.MergeNode(JSON.parse(JSON.stringify(Node2)), ANDSubgraph);
     let connected_to_Node1 = SubGraph[Dir1][RelType1][Node1.properties.uuid || Node1].map((rel_uuid) => {
       let rel = SubGraph.rels[rel_uuid];
       if (Dir1 == "outgoing") { return rel.to_id; } else { return rel.from_id; }
     });

     let connected_to_Node2 = SubGraph[Dir2][RelType2][Node2.properties.uuid || Node2].map((rel_uuid) => {
       let rel = SubGraph.rels[rel_uuid];
       if (Dir2 == "outgoing") { return rel.to_id; } else { return rel.from_id; }
     });
     let SharedUUIDS = connected_to_Node1.filter(n => connected_to_Node2.includes(n));

     SharedUUIDS.forEach((uuid) => {
       this.MergeNode(JSON.parse(JSON.stringify(SubGraph.nodes[uuid])),ANDSubgraph);
     })
     return ANDSubgraph;
   }
 }




  return GraphJS;
});
