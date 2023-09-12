module.exports = {
    RemoveSubGraph1: function () {
        return {
            "nodes": {
                "Node1": {
                    "labels": [
                        "Label1"
                    ],
                    "properties": {
                        "uuid": "Node1"
                    },
                    "id": "Node1"
                },
                "Node2": {
                    "labels": [
                        "Label1"
                    ], 
                    "properties": {
                        "uuid": "Node2"
                    },
                    "id": "Node2"
                },
                "Node3": {
                    "labels": [
                        "Label2"
                    ],
                    "properties": {
                        "uuid": "Node3"
                    },
                    "id": "Node3"
                },
                "Node4": {
                    "labels": [
                        "Label2"
                    ],
                    "properties": {
                        "uuid": "Node4"
                    },
                    "id": "Node4"
                }
            },
            "node_label_index": {
                "Label1": [
                    "Node1",
                    "Node2"
                ],
                "Label2": [
                    "Node3", "Node4"
                ]
            },
            "rels": {
                "Rel1": {
                    "type": "rel_label_1",
                    "properties": {
                        "uuid": "Rel1"
                    },
                    "id": "Rel1",
                    "from_id": "Node1",
                    "to_id": "Node2"
                },
                "Rel2": {
                    "type": "rel_label_2",
                    "properties": {
                        "uuid": "Rel2"
                    },
                    "uuid": "Rel2",
                    "to_id": "Node4",
                    "from_id": "Node3"
                }
            },
            "rel_label_index": {
                "rel_label_1": [
                    "Rel1"
                ],
                "rel_label_2":["Rel2"]
            },
            "outgoing": {
                "rel_label_1": {
                    "Node1": [
                        "Rel1"
                    ]
                },
                "rel_label_2": {
                    "Node3": [
                        "Rel2"
                    ]
                }
            },
            "incoming": {
                "rel_label_1": {
                    "Node2": [
                        "Rel1"
                    ]
                },
                "rel_label_2": {
                    "Node4": [
                        "Rel2"
                    ]
                }
            }
        }
    },

    RemoveSubGraph2: function () {
        return {
            "nodes": {
                "Node3": {
                    "labels": [
                        "Label2"
                    ],
                    "properties": {
                        "uuid": "Node3"
                    },
                    "id": "Node3",
                },
                "Node4": {
                    "labels": [
                        "Label2"
                    ],
                    "properties": {
                        "uuid": "Node4"
                    },
                    "id": "Node4",
                },

            },
            "node_label_index": {
                "Label2": ["Node3", "Node4"]
            },
            "rels": { "Rel2": { "type": "rel_label_2", "properties": { "uuid": "Rel2" }, "uuid": "Rel2", "to_id": "Node4", "from_id": "Node3" } },

            "rel_label_index": {
                "rel_label_2": ["Rel2"]
            },
            "outgoing": {
                "rel_label_2": { "Node3": ["Rel2"] }
            },
            "incoming": {
                "rel_label_2": { "Node4": ["Rel2"] }
            }
        };
    },

    RemoveExpectedResult: function () {
        return {
            "nodes": {
                "Node1": {
                    "labels": [
                        "Label1"
                    ],
                    "properties": {
                        "uuid": "Node1"
                    },
                    "id": "Node1",
                },
                "Node2": {
                    "labels": [
                        "Label1"
                    ],
                    "properties": {
                        "uuid": "Node2"
                    },
                    "id": "Node2",
                }
            },
            "node_label_index": {
                "Label1": ["Node1", "Node2"],
            },
            "rels": {
                "Rel1": {
                    "type": "rel_label_1",
                    "properties": {

                        "uuid": "Rel1"
                    },
                    "id": "Rel1",
                    "from_id": "Node1",
                    "to_id": "Node2"
                },

            },
            "rel_label_index": {
                "rel_label_1": ["Rel1"]
            },
            "outgoing": {
                "rel_label_1": { "Node1": ["Rel1"] }
            },
            "incoming": {
                "rel_label_1": { "Node2": ["Rel1"] }
            }
        };
    }

}