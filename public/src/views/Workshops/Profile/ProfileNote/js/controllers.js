
function profileNoteCardCtrl($scope, $rootScope, $stateParams, $state, notify, sweetAlert, ProfileWorkshopAPI, GraphJS, $uibModal, $timeout) {
    // let Socket = socket($scope);
    // Socket.connect($scope.note.properties.uuid);
    // Socket.on("post.vote", (data) => {
    //     GraphJS.joinSubGraphs($scope.profileSubGraph, data);
    //     triggerSortBy();
    // })
    // Socket.on("delete.vote", (data) => {
    //     GraphJS.SubtractSubGraphs($scope.profileSubGraph, data);
    //     triggerSortBy();
    // })
    // Socket.on("post.comment", (data) => {
    //     GraphJS.joinSubGraphs($scope.profileSubGraph, data);
    //     triggerSortBy();
    // })
    // Socket.on("delete.note", (data) => {
    //     GraphJS.RemoveNodeFromLocalSubgraph({label:["Note"], properties:{uuid:data}},$scope.profileSubGraph);
    //     triggerSortBy();
    // })
    $scope.CrossReference = GraphJS.CrossReference;

    $scope.vote = function (str) {
        let exists = null;

        let myProfile = $scope.profileSubGraph.nodes[$scope.profileSubGraph.node_label_index.Profile[0]];

        let myAttribute = $scope.profileSubGraph.nodes[$scope.profileSubGraph.rels[$scope.profileSubGraph.outgoing.note_attribute[$scope.note.properties.uuid][0]].to_id];
        let myInteraction = $scope.profileSubGraph.nodes[$scope.profileSubGraph.rels[$scope.profileSubGraph.outgoing.note_interaction[$scope.note.properties.uuid][0]].to_id];

        let counted = 0;

        let limit = myProfile.properties.vote_limit_per_attribute || 3;
        let rel_ids = null;

        if ($scope.profileSubGraph.incoming[str]) rel_ids = $scope.profileSubGraph.incoming[str][$scope.note.properties.uuid];
        (rel_ids || []).map((item) => {
            if ($scope.profileSubGraph.rels[item].from_id == $rootScope.Person.properties.uuid) {
                exists = item;
            }
        })


        //Get Notes of this notes interaction and in the same attribute
        let myAttribute_AND_myInteraction = GraphJS.AND(myAttribute, "incoming", "note_attribute", myInteraction, "incoming", "note_interaction", $scope.profileSubGraph);
        //Iterate those notes, counting any that have a vote of this vote type from this user!


        myAttribute_AND_myInteraction.node_label_index.Note.forEach((uuid) => {
            if ($scope.profileSubGraph.incoming[str] && $scope.profileSubGraph.outgoing[str] && $scope.CrossReference($scope.profileSubGraph.incoming[str][uuid], $scope.profileSubGraph.outgoing[str][$rootScope.Person.properties.uuid])) {
                counted++;
            }
        })

        if (exists == null) {
            let vote = {
                type: str,
                properties: {
                    uuid: uuidv4()
                },
                to_id: $scope.note.properties.uuid,
                from_id: $rootScope.Person.properties.uuid
            }
            // Add then to trigger parent's sortBy
            if(limit > counted) {
                ProfileWorkshopAPI.PostVote(vote)
            }
        } else {
            // Add then to trigger parent's sortBy
            ProfileWorkshopAPI.DeleteVote(exists)
        }
    }

    // $scope.comment = function () {
    //     if ($scope.profileSubGraph.incoming[str]) rel_ids = $scope.profileSubGraph.incoming[str][$scope.note.properties.uuid];
    //     (rel_ids || []).map((item) => {
    //         if ($scope.profileSubGraph.rels[item].from_id == $rootScope.Person.properties.uuid) exists = item;
    //     })

    //     if (exists == null) {
    //         let vote = {
    //             type: str,
    //             properties: {
    //                 uuid: uuidv4()
    //             },
    //             to_id: $scope.note.properties.uuid,
    //             from_id: $rootScope.Person.properties.uuid
    //         }
    //         ProfileWorkshopAPI.PostVote(vote).then(()=> {
    //             triggerSortBy()
    //         });
    //     } else {
    //         ProfileWorkshopAPI.DeleteVote(exists).then(()=> {
    //             triggerSortBy()
    //         });
    //     }
    // }

    //Needs to be wired, but would send a direct ping to the author of any note. If they are online they would recieve a notification from the sender, helping people find eachother in the real world
    $scope.ring_author = function () {

    }

    //Used to construct and send comment to this note

    $scope.voice_of_customer = false;
    $scope.reply = "";
    $scope.post_reply = function () {

        $scope.replying = true;
        // Prevent user from mannurally insert [VoC] or [VOC] at index of 0 and 1 of a comment,
        // but still alow them to type 'VoC' in after that.
        if ($scope.reply.length < 3) {
            $scope.replying = false;
            return;
        }
        var rel = {
            from_id: $rootScope.Person.properties.uuid,
            to_id: $scope.note.properties.uuid,
            type: "comment",
            properties: {
                comment: $scope.voice_of_customer ? '[VoC] ' + $scope.reply : $scope.reply,
                uuid: uuidv4()
            }
        };
        ProfileWorkshopAPI.PostComment(rel).then(() => {
            $scope.voice_of_customer = false;
            $scope.reply = '';
        });
    }


    //Launches the Confirm Delete overlay
    $scope.delete = function () {

    }

    function triggerSortBy() {
        $scope.$parent.sortBy($scope.$parent.sortValue)
    }
}
