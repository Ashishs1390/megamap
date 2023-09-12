module.exports = {
    DiffSG1: function() {
        return {
            "nodes": {
                "Node1": {
                    "labels": [
                        "Label1"
                    ],
                    "properties": {
                        "uuid": "Node1",
                        "order":3,
                        "testing":false
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
                }


            },
            "node_label_index": {
                "Label1": ["Node1", "Node2"]
            }
        }

    },

    DiffSG2: function() {
        return {
            "nodes": {
                "Node1": {
                    "labels": [
                        "Label1"
                    ],
                    "properties": {
                        "uuid": "Node1",
                        "extra_prop":"this is new",
                        "order":5
                    },
                    "id": "Node1"
                },
                "Node3": {
                    "labels": [
                        "Label1"
                    ],
                    "properties": {
                        "uuid": "Node3"
                    },
                    "id": "Node3"
                }


            },
            "node_label_index": {
                "Label1": ["Node1", "Node3"]
            }
        };
    },

    RemoveExpectedResult: function() {
        return {}
    }

}