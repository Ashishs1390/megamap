import GraphJS from '../lib/graph';

module.exports = {
    GetConnectedJourneys: function (from_label, rels, SubGraph, db) {
      return new Promise(function (resolve, reject) {
        if(rels){
          let rel_nodes = rels.map((rel) => { return SubGraph.rels[rel].to_id })
          let query = `match (n:Note)-[rel:note_journey]->(journey) where n.uuid in {rel_nodes} return n, journey`
          db.cypher({ query: query, params: { rel_nodes } },
            (err, results) => {
              if (err) reject(err);
              results.map((result) => {
                if(result){
                  return SubGraph.nodes[result.n.properties.uuid].properties.journey = result.journey.properties;
                }
              })
              resolve();
            })
          } else {
            resolve();
          }
        })
      },

    GetOutgoingRels: function (uuids, SubGraph, label, db) {
        return new Promise(function (resolve, reject) {
            if (!uuids) reject("No uuids");
            

            let query = `match (from_node)-[rel${label ? ":" + label : ''}]->(to_node) where from_node.uuid in {uuids} return from_node, rel, to_node`
            db.cypher({ query: query, params: { uuids } },
                (err, results) => {
                    if (err) reject(err);
                    results.map((relationship) => {
                        GraphJS.MergeRemoteRelationship(relationship, SubGraph);
                    })
                    resolve(results);
                });
        })
    },
    GetOutgoingRelsCase: function (uuids, SubGraph, label, db,parameters) {
        return new Promise(function (resolve, reject) {
            if (!uuids) reject("No uuids");
            let query = `match (from_node)-[rel${label ? ":" + label : ''}]->(to_node) where from_node.uuid in {uuids}  MATCH (to_node) WHERE to_node.email =~ '.*${parameters.searchTerm}.*' OR to_node.firstname =~ '(?i).*${parameters.searchTerm}.*' OR to_node.alias =~ '(?i).*${parameters.searchTerm}.*' OR to_node.lastname =~ '(?i).*${parameters.searchTerm}.*' return from_node, rel, to_node ORDER BY LOWER(to_node.email) skip ${parameters.skip} limit ${parameters.limit}`
            db.cypher({ query: query, params: { uuids } },
                (err, results) => {
                    if (err) reject(err);
                    results.map((relationship) => {
                        GraphJS.MergeRemoteRelationship(relationship, SubGraph);
                    })
                    resolve(results);
                });
        })
    },

    GetIncomingRels: function (uuids, SubGraph, label, db) {
        return new Promise(function (resolve, reject) {
            if (!uuids) reject("No uuids");
            let query = `match (from_node)-[rel${label ? ":" + label : ''}]->(to_node) where to_node.uuid in {uuids} return from_node, rel, to_node`
            db.cypher({ query: query, params: { uuids } },
                (err, results) => {
                    if (err) reject(err);
                    results.map((relationship) => {
                        GraphJS.MergeRemoteRelationship(relationship, SubGraph);
                    })
                    resolve(results);
                });
        });
    },
    AddRemoteNodeToSubgraph: function (uuid, SubGraph, db) {

        return new Promise(function (resolve, reject) {
            if (!uuid) reject();
            db.cypher({ query: `match (node {uuid:'${uuid}'}) return node` },

                (err, results) => {
                    if (err || results.length == 0 || !results[0].node) { reject(); return }
                    var result = results[0].node;
                    delete result._id;
                    if (SubGraph) GraphJS.MergeNode(result, SubGraph);
                    resolve(result)
                })
        })
    }
}
