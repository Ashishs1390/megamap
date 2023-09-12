app.controller('singleSubscriberCtrl', singleSubscriberCtrl);
app.controller('multiSubscriberCtrl', multiSubscriberCtrl);
app.controller('multiSubscriberAudienceCtrl', multiSubscriberAudienceCtrl);
app.controller('multiSubscriberBullsEyeCtrl', multiSubscriberBullsEyeCtrl);


function singleSubscriberCtrl($scope, GraphJS, SharedAPI) {
    $scope.Initialize = function () {
        if (!$scope.pool) {
            $scope.Getting = true;
            $scope.pool = {};
            SharedAPI.GetAllNodesByLabel($scope.label)
                .then(function (nodes) {
                    $scope.Getting = false;
                    $scope.pool = nodes;
                }).catch(function (err) {
                    $scope.Getting = false;
                });
        }
    }
    $scope.AddToLocal = function (node) {
        if (!$scope.subgraph.nodes) $scope.subgraph.nodes = {};
        var SG2 = {};
        GraphJS.MergeNode(node, SG2);
        GraphJS.joinSubGraphs($scope.subgraph, SG2);
        let rel = {
            properties: {}
        };
        let node_id = node.properties.uuid;
        let rel_id = null;
        if ($scope.original.outgoing && $scope.original.outgoing[$scope.type] && $scope.original.outgoing[$scope.type][$scope.pivot] && $scope.original.outgoing[$scope.type][$scope.pivot][0]) {
            if ($scope.original.rels[$scope.original.outgoing[$scope.type][$scope.pivot][0]].to_id == node_id) {
                rel_id = $scope.original.outgoing[$scope.type][$scope.pivot][0];
            }
        }
        rel.type = $scope.type;
        rel.properties.uuid = rel_id || uuidv4();
        rel.from_id = $scope.pivot;
        rel.to_id = node.properties.uuid;
        GraphJS.MergeRelationship(rel, $scope.subgraph);


    }
    $scope.RemoveFromLocal = function (node) {
        console.log('right here bruh')
        let sg = {};
        GraphJS.MergeNode(node, sg);
        GraphJS.SubtractSubGraphs($scope.subgraph, sg);
        GraphJS.CleanStrandedRels($scope.subgraph);

    }
    $scope.Initialize();
}

//Known Bug! If you have more than 1 subscriber pointing at the same node label, it can only currently support 1 sort order shared for each member.... oops. Rethink
function multiSubscriberCtrl($window, $scope,$location ,GraphJS, SharedAPI,$http, $timeout, $uibModal,$rootScope,$state ,attendeeDataAddToLocalService,attendeeDataSubmitService, JourneyWorkshopAPI) {
       $scope.removedComponents = {
            node_label_index : {
                Interaction:[],
                Persona:[],
                Stage:[],
                Strategy:[],
                Capability:[],
                Mot:[],
                Kpi:[],
                Product:[],
                Audiences:[]
            },
            nodes:{}
        }
    $scope.connectionNotes = $rootScope.connectionNotes;
    $scope.filteredComponents = [];
    $scope.pagination = {
        currentPageAttendee :0,
        maxSizeAttendee:5,
        attendeeSize:0
    };
    $scope.paginationAll = {
        currentPage : 0,
        maxSize : 3,
    };
    $scope.numPerPage = 10;
    // $scope.attendeeSize = 0;
    $scope.attendeePool = {};
    $scope.subAttendeePool = {};

    $scope.uuid = '';
    $scope.searchTerm = '';
    $scope.mostAddedAttendee = {};
    $scope.mostAddedVisible = false;
    $scope.stagedData = [];
    $scope.obj = {};
    let limit = 10;
    $scope.mostUsedData = [];
    $scope.showMostAddedTitle = true;
    $scope.facilitatorMostedUsed = false;
    $scope.isReadonly = false;
    $scope.isReadonlyAttendee = false;
    $scope.skipAddedAtendee = 0;
    $scope.projectAssignee = $rootScope.noteProjectAssignee;
    $scope.isNoteAssignee = $rootScope.isNoteAssigneeOpen;


    if($scope.type == "journey_attendee"){
        $scope.paginationAddedAttendee = {
            itemPerPage:10,
            currentPage :0,
            totalItems:0,
        }

        let params = {
            uuid:$rootScope.uuidForAttendee,
            type:"journey_attendee",
            searchTerm:$scope.searchTerm
        };
        $http({ method: 'GET', url: '/api/node/all/attendeeadded/count', params }).then(function(resp){
            $scope.paginationAddedAttendee.totalItems = resp.data.count;
        }).catch(function(err){
            console.log(err)
        });

        $scope.uuid = $rootScope.uuidForAttendee;
         params = {
            skip:0,
            searchTerm: $scope.searchTerm,
            limit: $scope.paginationAddedAttendee.itemPerPage,
            uuid:$scope.uuid,
        };
        $rootScope.$broadcast("getAttendee" , params);

        $scope.changeUsersAddedAttendee = function(){
            if($scope.paginationAddedAttendee.currentPage != 1){
                $scope.skipAddedAtendee = (($scope.paginationAddedAttendee.currentPage - 1) * $scope.paginationAddedAttendee.itemPerPage) +1;
                $scope.skipAddedAtendee = $scope.skipAddedAtendee -1;
            } else {
                $scope.skipAddedAtendee = 0;
            }
            let params = {
                skip:$scope.skipAddedAtendee,
                limit: $scope.paginationAddedAttendee.itemPerPage,
                searchTerm:$scope.searchTerm
            }
            $scope.isReadonlyAttendee = true;
            $rootScope.$broadcast("getAttendee" , params);
            setTimeout(function(){
                $scope.isReadonlyAttendee = false;
            },100)


        }
    }


    // $scope.attendeeSearch = '';
    // $scope.changePage = function(isComponentRemoved){
    //     if($scope.isMostUsedVisible && !isComponentRemoved){
    //         //$scope.pool = angular.copy($scope.allComponents);
    //         $scope.isMostUsedVisible = false;
    //         $scope.paginationAll.currentPage = 1;
    //         var begin = 0
    //         , end = begin + $scope.numPerPage;
    //         if($scope.label != "Person"){
    //             $scope.filteredComponents = $scope.allComponentsWithFilter.node_label_index[$scope.label].slice(begin, end);
    //         }
    //         let id = "pagination"+$scope.label;
    //         var uls = document.getElementById(id).getElementsByTagName('ul');
    //         var lis = uls[0].getElementsByTagName('li');
    //         var li = lis[1];
    //         li.classList.add('active');
    //     }
    //     else{
    //         var begin, end;
    //         if(isComponentRemoved){
    //             begin = 0;
    //             end = begin + $scope.numPerPage;
    //         }else{
    //             begin = (($scope.paginationAll.currentPage - 1) * $scope.numPerPage);
    //             end = begin + $scope.numPerPage;
    //         }

    //         if($scope.label != "Person"){
    //             $scope.filteredComponents = $scope.allComponentsWithFilter.node_label_index[$scope.label].slice(begin, end);
    //         }
    //     }
    // }
    //
    // $scope.uuid = $rootScope.uuidForAttendee || $rootScope.journey__uuid ||$rootScope.projectUuid || $rootScope.milestoneUuid ;
    // console.log($scope.type);
    if($scope.label == "Person"){
        $scope.attendee = function(){
            let params = {};
            let personType = '';
            if($scope.type == "bullseye_attendee"){
                $scope.uuid = $rootScope.bullseye__uuid ;
                   params = {
                       skip: 0,
                        limit: limit,
                        uuid:$scope.uuid,
                        searchTerm:'',
                        type:"bullseye_attendee"
                    }
                personType = "attendee";
            } else
            if($scope.type == "journey_attendee"){
                $scope.uuid = $rootScope.uuidForAttendee;
                   params = {
                       skip: 0,
                        limit: limit,
                        uuid:$scope.uuid,
                        searchTerm:'',
                        type:"journey_attendee"
                    }
                personType = "attendee";
            } else if ($scope.type == "facilitator"){
                $scope.uuid = $rootScope.journey__uuid;
                params = {skip: 0,
                limit: limit,
                uuid:$scope.uuid,
                searchTerm:'',
                type:"facilitator"
                }
                personType = "facilitator";
            } else if($scope.type == "project_attendee"){
                $scope.uuid = $rootScope.projectUuid;

                   params = {
                       skip: 0,
                        limit: limit,
                        uuid:$scope.uuid,
                        searchTerm:'',
                        type:"project_attendee"
                    }
                personType = "attendee";
            } else if($scope.type == "milestone_coordinator"){
                $scope.uuid = $rootScope.milestoneUuid;

                   params = {
                       skip: 0,
                        limit: limit,
                        uuid:$scope.uuid,
                        searchTerm:'',
                        type:"milestone_coordinator"
                    }
                personType = "attendee";
            }


            // SharedAPI.GetAttendeeCount(params)
            // .then((nodes)=>{
            //     $scope.pagination.attendeeSize = nodes.count;
            // })
            // SharedAPI.GetAttendee(params)
            // .then((nodes)=>{
            //     $scope.attendeePool = nodes;
            // });
            // if($scope.type == "facilitator" || $scope.type=="journey_attendee"){
            //     SharedAPI.GetMostUsedByLabel(personType).then((nodes)=>{
            //     $scope.mostAddedAttendee = nodes;
            //     if(nodes.message == "You have not added any component of Person type to any journey"){
            //         $scope.mostAddedAttendee = {
            //             node_label_index : {
            //                 Person:[]
            //             }
            //         };
            //         $scope.mostAddedVisible = false;
            //         $scope.noMostAddedAttendee = false;
            //         $scope.showMostAddedTitle = false;
            //         $scope.facilitatorMostedUsedToggle = false;
            //     }
            //     else if(nodes.node_label_index["Person"].length > 0){
            //         let id = "paginationPerson";
            //         document.getElementById(id).querySelectorAll(".active")[0].classList.remove("active")
            //         $scope.stagedData = $rootScope.stagedDataAttendee.node_label_index["Person"];
            //         $scope.mostUsedData = nodes.node_label_index["Person"];
            //         if($scope.mostUsedData.length !=0){
            //             $scope.mostAddedVisible = true;
            //         }
            //         if($scope.stagedData  == "undefined"){
            //             $scope.stagedData = [];
            //         }
            //         if($scope.mostUsedData  == "undefined"){
            //             $scope.mostUsedData = [];
            //         }
            //         $scope.mostUsedSorted = arr_diff($scope.stagedData,$scope.mostUsedData);
            //         let filteredData = $scope.mostUsedSorted.filter( ( el ) => nodes.node_label_index["Person"].includes( el ) );
            //         if($scope.mostUsedSorted.length == 0){
            //             $scope.mostAddedVisible = false;
            //             $scope.mostAddedAttendee.node_label_index["Person"] = [];
            //             $scope.showMostAddedTitle = false;
            //         }else {
            //             $scope.mostAddedVisible = true;
            //             $scope.mostAddedAttendee.node_label_index["Person"] = filteredData;
            //             $scope.showMostAddedTitle = true;
            //         }

            //         if($scope.mostAddedAttendee.node_label_index.Person.length == 0 ){
            //             $scope.facilitatorMostedUsed = false;
            //         }
            //         else {
            //             if($scope.type == "facilitator"){
            //                 let arr= [];
            //                 let bb = $scope.mostAddedAttendee.node_label_index["Person"].map(function(item,i){
            //                 if($scope.mostAddedAttendee.nodes[item].properties.hasOwnProperty('admin') || $scope.mostAddedAttendee.nodes[item].properties.hasOwnProperty('tenant')){
            //                     arr.push($scope.mostAddedAttendee.nodes[item].properties.uuid);
            //                     if(arr.length == 0){
            //                         $scope.mostAddedAttendee.node_label_index["Person"] = [];
            //                         $scope.facilitatorMostedUsed = false;
            //                         $scope.mostAddedVisible = false;
            //                         $scope.facilitatorMostedUsedToggle = false;
            //                     }else {
            //                         $scope.mostAddedAttendee.node_label_index["Person"] = arr;
            //                         $scope.facilitatorMostedUsed = true;
            //                         $scope.mostAddedVisible = true;
            //                         $scope.facilitatorMostedUsedToggle = true;


            //                     }
            //                 }else {
            //                     $scope.facilitatorMostedUsed = false;
            //                     $scope.mostAddedVisible = false;
            //                     $scope.facilitatorMostedUsedToggle = false;

            //                 }
            //                 });
            //             }

            //         }

            //     }

            // });
            // }else {
            //     $scope.showMostAddedTitle = false;
            // }

        }
        // above and below commented code is for most used facilitator


        // function arr_diff (a1, a2) {
        //     var a = [], diff = [];
        //     if(a1 == null || a1 == undefined){
        //         return a2;
        //     }
        //     for (var i = 0; i < a1.length; i++) {
        //         a[a1[i]] = true;
        //     }
        //     for (var i = 0; i < a2.length; i++) {
        //         if (a[a2[i]]) {
        //             delete a[a2[i]];
        //         } else {
        //             a[a2[i]] = true;
        //         }
        //     }
        //     for (var k in a) {
        //         diff.push(k);
        //     }
        //     return diff;
        // }

        // $scope.showAllComponentAttendee = function() {
        //     $scope.mostAddedVisible = false;
        //     $scope.facilitatorMostedUsed = false;
        //     setTimeout(function(){
        //         let params = {};

        //         if($scope.type == "journey_attendee"){
        //             $scope.uuid = $rootScope.uuidForAttendee;
        //             params = {
        //                 skip:0,
        //                 searchTerm: $scope.searchTerm,
        //                 limit: limit,
        //                 uuid:$scope.uuid,
        //                 type:"journey_attendee"
        //             }
        //         }else if($scope.type == "facilitator"){
        //             $scope.uuid = $rootScope.journey__uuid;
        //             params = {
        //                 skip:0,
        //                 searchTerm: $scope.searchTerm,
        //                 limit: limit,
        //                 uuid:$scope.uuid,
        //                 type:"facilitator"
        //             }
        //         }else if($scope.type == "project_attendee"){
        //             $scope.uuid = $rootScope.projectUuid;
        //             params = {
        //                 skip:0,
        //                 searchTerm: $scope.searchTerm,
        //                 limit: limit,
        //                 uuid:$scope.uuid,
        //                 type:"project_attendee"
        //             }
        //         }else if($scope.type == "milestone_coordinator"){
        //             $scope.uuid = $rootScope.milestoneUuid;
        //             params = {
        //                 skip:0,
        //                 searchTerm: $scope.searchTerm,
        //                 limit: limit,
        //                 uuid:$scope.uuid,
        //                 type:"milestone_coordinator"
        //             }
        //         }
        //             console.log(params)

        //         SharedAPI.GetAttendee(params)
        //         .then((nodes)=>{
        //             $scope.pagination.currentPageAttendee = 0;
        //             $scope.attendeePool = nodes;
        //         });

        //         SharedAPI.GetAttendeeCount(params)
        //         .then((nodes)=>{
        //             $scope.pagination.attendeeSize = nodes.count;
        //         })

        //         let id = "paginationPerson";
        //         var uls = document.getElementById(id).getElementsByTagName('ul');
        //         var lis = uls[0].getElementsByTagName('li');
        //         var li = lis[2];
        //         li.classList.add('active');
        //     },500);
        // }

        $scope.showMostedUsed = function(){
            $scope.mostAddedVisible = true;
            $scope.facilitatorMostedUsed = true;
            let id = "paginationPerson";
            document.getElementById(id).querySelectorAll(".active")[0].classList.remove("active");

        }
        $scope.attendee();
        // $scope.changePageAttendee = function(){
        //         let begin = (($scope.pagination.currentPageAttendee - 1) * $scope.numPerPage);
        //     // begin = begin;
        //     let params = {};
        //     if($scope.type == "bullseye_attendee"){
        //         $scope.uuid = $rootScope.bullseye__uuid ;
        //         params = {
        //             skip: begin,
        //             limit: limit,
        //             uuid:$scope.uuid,
        //             searchTerm:$scope.searchTerm,
        //             type:"bullseye_attendee"
        //         }
        //     }else

        //     if($scope.type == "journey_attendee"){
        //         $scope.uuid = $rootScope.uuidForAttendee;
        //         params = {
        //             skip: begin,
        //             limit: limit,
        //             uuid:$scope.uuid,
        //             searchTerm:$scope.searchTerm,
        //             type: "journey_attendee"
        //         }
        //     }else if($scope.type == "facilitator"){
        //         $scope.uuid = $rootScope.journey__uuid;
        //         params = {
        //             skip: begin,
        //             limit: limit,
        //             uuid:$scope.uuid,
        //             searchTerm:$scope.searchTerm,
        //             type: "facilitator"
        //         }
        //     }else if($scope.type == "project_attendee"){
        //         $scope.uuid = $rootScope.projectUuid;
        //         params = {
        //             skip: begin,
        //             limit: limit,
        //             uuid:$scope.uuid,
        //             searchTerm:$scope.searchTerm,
        //             type: "project_attendee"
        //         }
        //     }else if($scope.type == "milestone_coordinator"){
        //         $scope.uuid = $rootScope.milestoneUuid;
        //         params = {
        //             skip: begin,
        //             limit: limit,
        //             uuid:$scope.uuid,
        //             searchTerm:$scope.searchTerm,
        //             type: "milestone_coordinator"
        //         }
        //     }
        //     $scope.isReadonly = true;
        //     SharedAPI.GetAttendee(params)
        //     .then((nodes)=>{
        //         $scope.isReadonly = false;
        //         $scope.attendeePool = nodes;
        //     }).catch(()=>{
        //         $scope.isReadonly = false;
        //     });

        // }
        var delayTimer;
         $scope.searchPause = true;
        $scope.fetchdata = function() {
            $scope.searchTerm = $scope.obj.searchAttendee;
            $scope.mostAddedVisible = false;
            if($scope.searchTerm !=""){
               $scope.searchPause = true;
            }

            let params = {};
            if($scope.type == "bullseye_attendee"){
                $scope.uuid = $rootScope.bullseye__uuid ;
                params = {
                    skip: 0,
                    limit: limit,
                    uuid:$scope.uuid,
                    searchTerm:$scope.searchTerm,
                    type:"bullseye_attendee"
                }
            }else
            if($scope.type == "journey_attendee"){
                $scope.uuid = $rootScope.uuidForAttendee;
                params = {
                    skip:0,
                    searchTerm: $scope.searchTerm,
                    limit: limit,
                    uuid:$scope.uuid,
                    type:"journey_attendee"
                };
            }
            else if($scope.type == "facilitator"){
                $scope.uuid = $rootScope.journey__uuid;
                params = {
                    skip:0,
                    searchTerm: $scope.searchTerm,
                    limit: limit,
                    uuid:$scope.uuid,
                    type:"facilitator"
                };
            }else if($scope.type == "project_attendee"){
                $scope.uuid = $rootScope.projectUuid;
                params = {
                    skip:0,
                    searchTerm: $scope.searchTerm,
                    limit: limit,
                    uuid:$scope.uuid,
                    type:"project_attendee"
                };
            }else if($scope.type == "milestone_coordinator"){
                $scope.uuid = $rootScope.milestoneUuid;
                params = {
                    skip:0,
                    searchTerm: $scope.searchTerm,
                    limit: limit,
                    uuid:$scope.uuid,
                    type:"milestone_coordinator"
                };
            }
            if($scope.searchPause){
                clearTimeout(delayTimer);
                delayTimer = setTimeout(function() {
                    SharedAPI.GetAttendee(params)
                    .then((nodes)=>{
                        $scope.pagination.currentPageAttendee = 0;
                        $scope.attendeePool = nodes;
                        if($scope.searchTerm == "") {
                            $scope.attendeePool = [];
                            $scope.searchPause = false;
                        } else {
                            $scope.searchPause = true;
                        }
                    });

                    SharedAPI.GetAttendeeCount(params)
                    .then((nodes)=>{
                            $scope.pagination.attendeeSize = nodes.count;
                    });
                    if($scope.type=="journey_attendee"){
                        let params = {
                            skip:0,
                            limit: $scope.paginationAddedAttendee.itemPerPage,
                            searchTerm:$scope.searchTerm,
                            type:"journey_attendee",
                            uuid:$rootScope.uuidForAttendee,
                        }
                        $rootScope.$broadcast("getAttendee" , params);
                        $http({ method: 'GET', url: '/api/node/all/attendeeadded/count', params }).then(function(resp){
                            $scope.paginationAddedAttendee.totalItems = resp.data.count;
                        }).catch(function(err){
                            console.log(err)
                        });
                    }

                }, 300);
            }
        }

    }

    $scope.PopCreateModal = function(label , createText) {
      localStorage.setItem('newComponentTitle',createText);
      PopCreateModal(label, $uibModal, function(success) {
        $scope.Initialize(true, false);

      });
    }

    $scope.$on('clearSearch',function(){
        $scope.search = '';
        $scope.searchComponent = '';
    });

    $scope.Initialize = function (refresh = false, clearSearch = true) {
        // if(clearSearch) $scope.search = '';
        if(clearSearch) $scope.searchComponent = '';
        if (!$scope.pool || refresh) {
            $scope.Getting = true;
            $scope.isMostUsedVisible = false;
            $scope.pool = {};
            $scope.mostUsed = {};
            $scope.allComponents = {};
            $scope.componentNew = {};

            $scope.mostUsedAvailable = false;
            $scope.allComponentsWithoutFilter = {};
            $scope.ascArray = [];
            if (!$scope.whereKey && !$scope.whereVal) {

                if($scope.label != "Person" && $scope.label != "Note" ){
                    SharedAPI.GetMostUsedByLabel($scope.label)
                    .then(function (nodes) {
                        if(!$scope.searchComponent.length){
                            $scope.isMostUsedVisible = true;
                              if($scope.searchComponent !=""){
                                         $scope.isMostUsedVisible = false;

                                     }
                        }
                        $scope.pool = $scope.mostUsed = nodes;
                        // getFilteredComponents("Stage");


                        if($scope.mostUsed.node_label_index && $scope.mostUsed.node_label_index[$scope.label].length){
                            $scope.mostUsed.node_label_index[$scope.label].forEach((item) =>{
                                if(!$scope.subgraph.node_label_index[$scope.label]){
                                    $scope.mostUsedAvailable = true;
                                    $scope.isMostUsedVisible = true;
                                    $scope.Getting = false;
                                    // console.log("-------------------");
                                    // console.log($scope.subgraph);
                                    if($scope.searchComponent !=""){
                                         $scope.isMostUsedVisible = false;

                                     }



                                    // setTimeout(function(){
                                    //     console.log('logged true '+$scope.label);
                                    //     let id = "pagination"+$scope.label;
                                    //     document.getElementById(id).querySelectorAll(".active")[0].classList.remove("active")
                                    // },$scope.allComponentsWithFilter.node_label_index[$scope.label].length + 400)
                                    // return;
                                }
                                else if($scope.subgraph.node_label_index[$scope.label] && $scope.subgraph.node_label_index[$scope.label].indexOf(item)==-1){
                                    $scope.mostUsedAvailable = true;
                                    $scope.isMostUsedVisible = true;
                                    $scope.Getting = false;
                                    if($scope.searchComponent !=""){
                                        $scope.isMostUsedVisible = false;

                                    }

                                    // setTimeout(function(){
                                    //     console.log('logged true '+$scope.label);
                                    //     let id = "pagination"+$scope.label;
                                    //     document.getElementById(id).querySelectorAll(".active")[0].classList.remove("active")
                                    // },
                                    // $scope.allComponentsWithFilter.node_label_index[$scope.label].length + 400)
                                    // return;
                                }
                            })
                        }

                    }).catch(function (err) {
                        $scope.Getting = false;
                    });
                }
                if($scope.label === 'Note'){
                    if($rootScope.isConnectionOpen){
                        $scope.isConnectionOpen = true;
                        $scope.Getting = false;
                        $scope.componentsPool = [
                        {
                            name : "Product",
                            properties : {
                                title : "Products"
                            }
                        },
                        {
                            name : "Audience",
                            properties : {
                                title : "Audiences"
                            }
                        },
                        {
                            name : "Initiative",
                            properties : {
                                title : "Initiatives"
                            }
                        },
                        {
                            name : "Strategy",
                            properties : {
                                title : "Strategies"
                            }
                        },
                        {
                            name : "Service",
                            properties : {
                                title : "Services"
                            }
                        },
                        {
                            name : "Capability",
                            properties : {
                                title : "Capabilities"
                            }
                        },
                        {
                            name : "Mot",
                            properties : {
                                title : "MOTs"
                            }
                        },
                        {
                            name : "Process",
                            properties : {
                                title : "Processes"
                            }
                        },
                        {
                            name : "App",
                            properties : {
                                title : "Apps"
                            }
                        },
                        {
                            name : "DataSource",
                            properties : {
                                title : "Data Sources"
                            }
                        },
                        {
                            name : "Kpi",
                            properties : {
                                title : "KPIs"
                            }
                        }
                    ]
                    }else{
                        $scope.label = 'Journey';
                        getData(false); // Get all Records for notes so keep isAll as true
                    }
                }else{
                    // getData(true); // Get first 50 records so keep isAll as false
                    getData(false); // Get all Records so keep isAll as true
                }

            } else {
                SharedAPI.GetAllNodesByLabelWhere($scope.label, $scope.whereKey, $scope.whereVal, $scope.whereType)
                .then(function (nodes) {
                    $scope.Getting = false;
                    $scope.pool = nodes;
                }).catch(function (err) {
                    $scope.Getting = false;
                });
            }
        }

    }
    delayTimer
    var delayTimerComponent;
    $scope.searchPauseComponent = true;
     $scope.fetchComponent = function(){
        if($scope.searchComponent !=""){
            $scope.searchPauseComponent = true;
        }
        if($scope.searchPauseComponent){
            clearTimeout(delayTimerComponent);
            delayTimerComponent = setTimeout(function() {
                $scope.isMostUsedVisible = false;
                if($scope.searchPauseComponent){
                    getData(false);
                }
            }, 800);
        }


    }


    function getData(queryString){
        // console.log($rootScope.connectionNotes);
        var url = $location.url();
        var res = url.contains("project");
        var journeyuuid = $rootScope.journey__uuid;
        if($scope.label != "Person"){
            $scope.Getting = true;
            $scope.notesAvailable = false;
            if (res || $scope.isComponentList) {
                SharedAPI.GetAllNodesByLabel($scope.label ,$scope.searchComponent, queryString,journeyuuid).then(function(nodes){
                    $scope.Getting = false;
                $scope.pool = nodes;
                if($scope.searchComponent == "") {
                    $scope.searchPauseComponent = false;
                } else {
                    $scope.searchPauseComponent = true;
                }
                $scope.notesAvailable = false;
                if ($scope.label === 'Note') {
                    $scope.notesAvailable = true;
                    if($scope.pool.node_label_index) {
                      $scope.pool.node_label_index.Note.forEach(function (uuid) {
                        if ($scope.pool.outgoing && $scope.pool.outgoing.note_journey && $scope.pool.outgoing.note_journey[uuid]) {
                          $scope.pool.nodes[uuid].journey = $scope.pool.nodes[$scope.pool.outgoing_nodes.note_journey[uuid][0]].properties;
                        }
                      })
                    }
                }else{
                    $scope.componentNew = nodes;
                    $scope.allComponents = nodes;
                    $scope.allComponentsWithFilter = {};
                    $scope.ascArray = [];
                    for(var key in $scope.mostUsed.nodes){
                        $scope.pool.nodes[key] = $scope.mostUsed.nodes[key];
                    }

                }

            }).catch(function (err) {
                    $scope.Getting = false;
                });
            }else{
            SharedAPI.GetALLSearchNodes($scope.label ,$scope.searchComponent, queryString,journeyuuid)
            .then(function (nodes) {
                $scope.Getting = false;
                $scope.pool = nodes;


                $scope.notesAvailable = false;
                if ($scope.label === 'Note') {
                    $scope.notesAvailable = true;
                    if($scope.pool.node_label_index) {
                      $scope.pool.node_label_index.Note.forEach(function (uuid) {
                        if ($scope.pool.outgoing && $scope.pool.outgoing.note_journey && $scope.pool.outgoing.note_journey[uuid]) {
                          $scope.pool.nodes[uuid].journey = $scope.pool.nodes[$scope.pool.outgoing_nodes.note_journey[uuid][0]].properties;
                        }
                      })
                    }
                }else{
                    $scope.componentNew = nodes;

                    if($scope.searchComponent == "") {
                    $scope.searchPauseComponent = false;
                    $scope.componentNew = [];
                    } else {
                        $scope.searchPauseComponent = true;
                    }
                    $scope.allComponents = nodes;
                    $scope.allComponentsWithFilter = {};
                    $scope.ascArray = [];
                    for(var key in $scope.mostUsed.nodes){
                        $scope.pool.nodes[key] = $scope.mostUsed.nodes[key];
                    }

                }

            }).catch(function (err) {
                    $scope.Getting = false;
            });
            }

        } else {
            let params = {};
            if($scope.type == "journey_attendee"){
                params = {
                    uuid:$scope.uuid,
                    type:"journey_attendee"
                }
            } else if($scope.type == "facilitator"){
                params = {
                    uuid:$scope.uuid,
                    type:"facilitator"
                }
            }

            SharedAPI.GetFacilitator(params)
            .then((nodes)=>{
                $scope.Getting = false;
                $scope.pool = nodes;
            });
        }
    }

    $scope.getComponents = function(component){
        $scope.isComponentList = true;
        $scope.selectedCompnent = $scope.label = component;
        getData(false);
    }


    $scope.checkConnectionExists = function(component){
       return $scope.connectionNotes.filter(e => e.description === $scope.pool.nodes[component].properties.title).length == 0
    }

    $scope.removeConnection = function (note , index) {
        swal({
          title: "Are you sure?",
          text: `You will remove ${note.description} with ${note.rels.connected_note_count} active connections`,
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, Remove it!"
        },
          function () {
            $rootScope.$broadcast('deleteConnection', note);
            $rootScope.connectionNotes.splice(index , 1);
          });
      }

    $scope.GoBackToComponents = function(){
        $scope.label = "Note";
        $scope.isComponentList = false;
    }

    $scope.createConnection = function(component){
        $http.post(`/api/journey/btl/${$state.params.id}`, {
          label: $scope.selectedCompnent,
          uuid: component.properties.uuid,
          person: $rootScope.Person.properties.uuid
        })
        .then(resp => {
          console.log(resp.data)
        })
        .catch(error => {
          console.error(error)
        })
      }

    function sortByAlpha(ascArray){
        $scope.newStage = [];
        let sorted = ascArray.sort(function(a,b){
            if(a.title == null || b.title == null ){
                return;
            }
            return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        sorted.forEach((v,i)=>{
            $scope.newStage.push(sorted[i].uuid);
        });
        return $scope.newStage;
    }

    $scope.filterComponents = function(){
        if($scope.isMostUsedVisible){
            //$scope.pool = angular.copy($scope.allComponents);
            $scope.isMostUsedVisible = false;
        }

        $scope.allComponentsWithFilter.node_label_index[$scope.label] = $scope.pool.node_label_index[$scope.label].filter((item) =>{
            let stringTitle = $scope.pool.nodes[item].properties.title.toLowerCase();
            let isExist = stringTitle.indexOf($scope.search.toLowerCase()) > -1;
            return isExist;
        })

        // var begin = 0
        // , end = begin + $scope.numPerPage;
        // if($scope.label != "Person"){
        //     $scope.filteredComponents = $scope.allComponentsWithFilter.node_label_index[$scope.label].slice(begin, end);
        // }
    }

    $scope.showMostUsed = function(){
        //$scope.pool = $scope.mostUsed;
        $scope.paginationAll.currentPage = 1;
        $scope.isMostUsedVisible = true;
        // setTimeout(function(){
        //     let id = "pagination"+$scope.label;
        //     document.getElementById(id).querySelectorAll(".active")[0].classList.remove("active");
        // },100)
    }

    $scope.showAllComponents = function(){
        if($scope.isMostUsedVisible){
            $scope.isMostUsedVisible = false;
            // var begin = 0
            // , end = begin + $scope.numPerPage;
            // if($scope.label != "Person"){
            //     $scope.filteredComponents = $scope.allComponentsWithFilter.node_label_index[$scope.label].slice(begin, end);
            // }
            // let id = "pagination"+$scope.label;
            // var uls = document.getElementById(id).getElementsByTagName('ul');
            // var lis = uls[0].getElementsByTagName('li');
            // var li = lis[1];
            // li.classList.add('active');
        }
    }
     $scope.getFilteredComponents = function (label){
        let filteredArray = [];
        if(label != "Person"){
            if($scope.mostUsed.node_label_index && $scope.mostUsed.node_label_index[label].length){
                $scope.mostUsed.node_label_index[label].forEach((item) =>{
                    if(!$scope.subgraph.node_label_index[label]){
                        filteredArray.push(item);
                    }
                    else if($scope.subgraph.node_label_index[label] && $scope.subgraph.node_label_index[label].indexOf(item)==-1){
                        filteredArray.push(item);
                    }
                })
            }
        }
        // console.log(filteredArray);

        return filteredArray;
    }

    $scope.GoBackToJourneys = function(){
        $scope.pool = $scope.allJourneys;
        $scope.label = "Journey";
        $scope.obj.searchAttendee = "";
    }

    $scope.getFilteredNoes = function(){
        return  ($scope.pool.node_label_index ? $scope.pool.node_label_index.Note : []);
    }

    $scope.cxiFilter = {
        one:false,
        two:false,
        three:false
    }

    $scope.filterByCXI = function(){
      if($scope.pool.node_label_index) {
        if($scope.label == "Note"){
            var selectedValues = [];
            var appliedFilter = [];

            for(key in $scope.cxiFilter){
                if($scope.cxiFilter[key] == true){
                    appliedFilter.push(key);
                }
            }

            if(!appliedFilter.length){
                return $scope.pool.node_label_index.Note;
            }else{
                var mapFilterValues = {
                    one:1,
                    two:2,
                    three:3
                }
                for(key in $scope.cxiFilter){
                    if($scope.cxiFilter[key]){
                        var currValue = mapFilterValues[key];
                        $scope.pool.node_label_index.Note.forEach(function(item){
                            if($scope.pool.nodes[item].properties.cxi_priority == currValue)
                            selectedValues.push(item);
                        })
                    }
                }
                return selectedValues;
            }
        }
      }
    }

    $scope.getNotes = function(node){
        $scope.selectedJourney = node;
        $scope.allJourneys = $scope.pool;
        $scope.obj.searchAttendee = "";
        $scope.label = "Note";
        $scope.Getting =true;
        let queryString = node.properties.uuid;
        getData(queryString); // true is to denote that it is for notes
    }
     $scope.subGraphPersonPool = {
        node_label_index : {
            Person:[]
        },
        nodes:{},
        incoming:{
            journey_attendee:{

            }
        },
        incoming_nodes:{
            journey_attendee:{

            }
        }
    }
    $scope.subPersonPool = {
        node_label_index : {
            Person:[]
        },
        nodes:{}
    }

    $scope.emailsToRemove = [];
    $scope.emailsToAdd = [];

    $scope.AddToLocal = function (node,invited = false) {
        if($rootScope.isNoteAssigneeOpen){
            let oldAssignee = { properties :  $rootScope.noteProjectAssignee };
            $scope.projectAssignee = $rootScope.noteProjectAssignee = node.properties;
            $timeout(function(){
                if(!oldAssignee.hasOwnProperty('labels')){
                    delete  oldAssignee.role;
                    oldAssignee['labels'] = node.labels;
                }
                $scope.RemoveFromLocal(oldAssignee);
            },100)
        }
        console.log("add to local");
            if(node.count){
                node.count++;
            }

            if (!$scope.subgraph.nodes) $scope.subgraph.nodes = {};
            var SG2 = {};
            if($scope.type != "journey_attendee"){
                GraphJS.MergeNode(node, SG2);
                GraphJS.joinSubGraphs($scope.subgraph, SG2);
                let rel = {
                    properties: {}
                };
                rel.type = $scope.type;
                rel.properties.uuid = uuidv4();
                rel.properties.uuid = rel.properties.uuid;
                rel.from_id = $scope.pivot || $scope.journey.uuid;
                rel.to_id = node.properties.uuid;
                GraphJS.MergeRelationship(rel, $scope.subgraph);
            }

        if($scope.type == "milestone_component"){
            $rootScope.projectInfoForNotes.notesToProject.push(node);
        }
        if($scope.type == "milestone_coordinator"){
            $scope.projectAssignee = $rootScope.noteProjectAssignee = node.properties;
        }

        if(node.labels[0] == "Person"){ // This if condition is added for bug -> "when adding attendee form the attendee list - remove added attendee from the full list"
            if(invited == false){
                var elemIndex = $scope.attendeePool.node_label_index[node.labels[0]].indexOf(node.properties.uuid);
                $scope.attendeePool.node_label_index[node.labels[0]].splice(elemIndex, 1);
            }

            if($scope.type == "journey_attendee"){
                if($scope.subPersonPool.node_label_index.Person.length != 0 ){
                    var elemIndex = $scope.subPersonPool.node_label_index[node.labels[0]].indexOf(node.properties.uuid);
                    $scope.subPersonPool.node_label_index[node.labels[0]].splice(elemIndex, 1);
                }



                var SG12 = {};
                GraphJS.MergeNode(node, SG12);

                    GraphJS.joinSubGraphs($scope.subGraphPersonPool, SG12);
                    let rel = {
                        properties: {}
                    };
                    rel.type = $scope.type;

                    rel.properties.uuid = uuidv4();
                    rel.properties.uuid = rel.properties.uuid;
                    rel.from_id = $scope.pivot || $scope.journey.uuid;
                    rel.to_id = node.properties.uuid;
                    GraphJS.MergeRelationship(rel, $scope.subGraphPersonPool);

                    let indexEmail = $scope.emailsToRemove.indexOf(node.properties.email);
                    if(indexEmail != -1){
                        $scope.emailsToRemove.splice(indexEmail,1);
                        attendeeDataSubmitService.addData($scope.emailsToRemove);
                    }

                    $scope.emailsToAdd.push(node.properties.email);
                    attendeeDataAddToLocalService.addData($scope.emailsToAdd)
            }

            // if($scope.type == "journey_attendee" || $scope.type == "facilitator"){
            //     let isPresentInAttendee = $scope.mostAddedAttendee.node_label_index[node.labels[0]].includes(node.properties.uuid);
            //     if(isPresentInAttendee){
            //         var elemIndex = $scope.mostAddedAttendee.node_label_index[node.labels[0]].indexOf(node.properties.uuid);
            //         $scope.mostAddedAttendee.node_label_index[node.labels[0]].splice(elemIndex, 1);
            //     }
            // }
        }
    }
    $scope.hideElements = function(item,pool){
        return pool.node_label_index.Person.some(function(val){
            return val === item;
        })
    }

    $scope.hideMe = function(item){
        item.hide=true;
    }



    $scope.RemoveFromLocal = function (node) {
        if($scope.type == "journey_attendee"){
            if($scope.subGraphPersonPool.node_label_index.Person.length != 0){
                GraphJS.RemoveNodeFromLocalSubgraph(node, $scope.subGraphPersonPool);
                Object.keys($scope.subGraphPersonPool.rels).forEach((id) => {
                    let item = $scope.subGraphPersonPool.rels[id];
                    if (item.to_id == node.properties.uuid)
                        delete $scope.subGraphPersonPool.rels[item.properties.uuid]
                })
            }
            GraphJS.RemoveNodeFromLocalSubgraph(node, $scope.subgraph);
            Object.keys($scope.subgraph.rels).forEach((id) => {
                let item = $scope.subgraph.rels[id];
                if (item.to_id == node.properties.uuid)
                    delete $scope.subgraph.rels[item.properties.uuid]
            });

            $scope.emailsToRemove.push(node.properties.email);
            attendeeDataSubmitService.addData($scope.emailsToRemove);

            let emailsRemoved = $scope.emailsToAdd.indexOf(node.properties.email);
            if(emailsRemoved != -1){
             $scope.emailsToAdd.splice(emailsRemoved,1);
                attendeeDataAddToLocalService.addData($scope.emailsToAdd)
            }
            if($scope.type == "journey_attendee" || $scope.type == "facilitator"){
                let isPresent = $scope.mostUsedData.includes(node.properties.uuid);
                if(isPresent){
                    $scope.mostAddedAttendee.node_label_index["Person"].push(node.properties.uuid);
                }

                $scope.subPersonPool.node_label_index[node.labels[0]].push(node.properties.uuid);
                $scope.subPersonPool.nodes[node.properties.uuid] = node;
            }
        } else {
            GraphJS.RemoveNodeFromLocalSubgraph(node, $scope.subgraph);
            Object.keys($scope.subgraph.rels).forEach((id) => {
                let item = $scope.subgraph.rels[id];
                if (item.to_id == node.properties.uuid)
                    delete $scope.subgraph.rels[item.properties.uuid]
            })

        if(node.labels[0] == "Person"){ // This if condition is added for bug -> "when adding attendee form the attendee list - remove added attendee from the full list"
            $scope.subPersonPool.node_label_index[node.labels[0]].push(node.properties.uuid);
            $scope.subPersonPool.nodes[node.properties.uuid] = node;
        }else {
            // if($scope.pool.nodes[node.properties.uuid].count){
            //     $scope.mostUsedAvailable = true;
            // }
            // $scope.componentNew.node_label_index[$scope.label] = sortByAlpha($scope.ascArray);
            // $scope.componentNew.node_label_index[$scope.label] = $scope.componentNew.node_label_index[$scope.label].filter((item) =>{
            //     return $scope.subgraph.node_label_index[$scope.label].indexOf(item) == -1
            // })
            // $scope.allComponentsWithFilter = angular.copy($scope.componentNew);
            // debugger;
            // if($scope.componentNew.length == 0){
            //     $scope.componentNew = $scope.removedComponents;
            // }
            $scope.isMostUsedVisible = false;
            // debugger
            $scope.removedComponents.node_label_index[node.labels[0]].unshift(node.properties.uuid);
            $scope.removedComponents.nodes[node.properties.uuid] = node;

            if(node.count){
               if(node.count == 1){
                    var elementIndex = $scope.mostUsed.node_label_index[$scope.label].findIndex( function(elementUUID) {
                        return elementUUID == node.properties.uuid;
                    })
                    $scope.mostUsed.node_label_index[$scope.label].splice(elementIndex , 1);
                }else if(node.count > 1){
                    node.count--;
                }
            }
            // $scope.changePage(true); // This true we are sending to indicate that we have removed component
        }
        if($scope.type == "journey_attendee" || $scope.type == "facilitator"){
            let isPresent = $scope.mostUsedData.includes(node.properties.uuid);
            if(isPresent){
                $scope.mostAddedAttendee.node_label_index["Person"].push(node.properties.uuid);
            }
        }

        }
    }

    $scope.sendInvite = function (email, journey, subdomain) {
        if (!email || email.length < 6) {
            $scope.error = 'invalid email address';
        } else {
            $http.post('/api/journey/invite', {
                email: email,
                inviteTo: journey,
                subdomain: subdomain,
                origin: $window.location.origin
            }).then(function (resp) {
                if (resp.data.email) {
                    // SharedAPI.GetALLSearchNodes($scope.label,email,journey.uuid)
                    //     .then(function (nodes) {
                    //         $scope.attendeePool = nodes;
                    //     })
                    // alert('sent email invite to '+resp.data.email)
                    $scope.inviteResponse = 'Invite sent!';
                    $scope.emailToInvite = '';
                    // console.log(invitedUser)
                    let invited = true;
                    $scope.AddToLocal({
                        labels: ['Person'],
                        properties: resp.data,
                    },invited);

                    // label ,searchTerm, isLimit,journeyuuid


                    $timeout(function () {
                        $scope.inviteResponse = '';
                    }, 3000)
                }
            }).catch(function (err) {
                $scope.error = err.data.message;
                $scope.inviteResponse = 'Not able to send email invite';
                console.log(err)

                $timeout(function () {
                    $scope.inviteResponse = '';
                }, 3000)
            })
        }
    }

    $scope.Initialize();


    $scope.CreateNew = (label) => {
      PopComponentCreateModal(label, $uibModal, () => {
        getData(false)
      });
    }
}

// END multiSubscriberCtrl

function multiSubscriberAudienceCtrl($scope, GraphJS, SharedAPI , $rootScope) {

    // console.log('initial:' + $scope.original);
    $scope.Initialize = function () {
        $scope.search = '';
        $scope.searchComponent = ''
        if (!$scope.pool) {
            $scope.Getting = true;
            $scope.pool = {};
            if (!$scope.whereKey && !$scope.whereVal) {
                SharedAPI.GetAllAudienceSegments()
                    .then(function (nodes) {
                        $scope.Getting = false;
                        $scope.pool = nodes;
                    }).catch(function (err) {
                        $scope.Getting = false;
                    });
                // GET All Strategies
                $scope.strategies = {};
            } else {
                SharedAPI.GetAllNodesByLabelWhere($scope.label, $scope.whereKey, $scope.whereVal, $scope.whereType)
                    .then(function (nodes) {
                        $scope.Getting = false;
                        $scope.pool = nodes;
                    }).catch(function (err) {
                        $scope.Getting = false;
                    });
            }
        }
    }

    $scope.getSegmentTitle = function (item) {
        var pool = $scope.pool;
        var result = null;
        var from_id = null;
        if (pool && pool.rels) {
            var rels = pool.rels;
            for (var key in rels) {
                if (rels[key].to_id === item && rels[key].type == 'segment_audiences') {
                    from_id = rels[key].from_id;
                    break;
                }
            }

            if (from_id) {
                for (var key in pool.nodes) {
                    if (key === from_id) {
                        result = '(' + pool.nodes[key].properties.title + ')';
                        break;
                    }
                }
            }
        }
        return result;
    }

    $scope.AddToLocal = function (node) {
        if (!$scope.subgraph.nodes) $scope.subgraph.nodes = {};
        var SG2 = {};
        GraphJS.MergeNode(node, SG2);
        GraphJS.joinSubGraphs($scope.subgraph, SG2);
        let rel = {
            properties: {}
        };
        rel.type = $scope.type;
        rel.properties.uuid = uuidv4();
        rel.properties.uuid = rel.properties.uuid;
        rel.from_id = $scope.pivot;
        rel.to_id = node.properties.uuid;
        GraphJS.MergeRelationship(rel, $scope.subgraph);
    }

    $scope.RemoveStrategyFromLocal = function (strategyNode, audienceId) {
        for (var id in $scope.subgraph.rels) {
            let item = $scope.subgraph.rels[id];
            if (item.from_id === audienceId && item.to_id === strategyNode.properties.uuid) {
                delete $scope.subgraph.rels[item.properties.uuid]
                break;
            }
        }
        var isStrategyRelatedToOtherAudience = false;
        for (var id in $scope.subgraph.rels) {
            let item = $scope.subgraph.rels[id];
            if (item.from_id === audienceId) {
                isStrategyRelatedToOtherAudience = true;
                break;
            }
        }

        if (!isStrategyRelatedToOtherAudience) {
            GraphJS.RemoveNodeFromLocalSubgraph(strategyNode, $scope.subgraph);
        }
    }

    $scope.RemoveFromLocal = function (node) {
        var to_ids = [];
        for (var id in $scope.subgraph.rels) {
            let item = $scope.subgraph.rels[id];
            if (item.from_id === node.properties.uuid) {
                to_ids.push(item.to_id);
                delete $scope.subgraph.rels[item.properties.uuid]
            }
        }

        for (var to_id in to_ids) {
            var isExist = false;
            for (var id in $scope.subgraph.rels) {
                let item = $scope.subgraph.rels[id];
                if (item.to_id === to_id) {
                    isExist = true;
                    break;
                }
            }
            if (!isExist) {
                GraphJS.RemoveNodeFromLocalSubgraph($scope.subgraph.nodes[to_id], $scope.subgraph);
            }
        }

        GraphJS.RemoveNodeFromLocalSubgraph(node, $scope.subgraph);
    }

    $scope.Initialize();
}

function multiSubscriberBullsEyeCtrl($scope, GraphJS, SharedAPI) {

    $scope.Initialize = function () {
        $scope.search = '';
        $scope.searchComponent = '';
        $scope.Getting = true;
        $scope.pool = {};
        SharedAPI.GetAllAudienceSegments()
            .then(function (nodes) {
                $scope.pool.audiences = nodes;
                SharedAPI.GetAllNodesByLabel('Strategy')
                    .then(function (strategies) {
                        $scope.Getting = false;
                        $scope.pool.strategies = strategies;
                    }).catch(function (err) {
                        $scope.Getting = false;
                    })
            }).catch(function (err) {
                $scope.Getting = false;
            });
    }

    $scope.getSegmentTitle = function (item) {
        var pool = $scope.pool.audiences;
        var result = null;
        var from_id = null;
        if (pool && pool.rels) {
            var rels = pool.rels;
            for (var key in rels) {
                if (rels[key].to_id === item && rels[key].type == 'segment_audiences') {
                    from_id = rels[key].from_id;
                    break;
                }
            }
            if (from_id) {
                for (var key in pool.nodes) {
                    if (key === from_id) {
                        result = '(' + pool.nodes[key].properties.title + ')';
                        break;
                    }
                }
            }
        }
        return result;
    }

    $scope.getSelectedAudiences = function () {
        if (!$scope.subgraph) return [];
        var audienceIds = [];
        for (var index in $scope.subgraph) {
            var item = $scope.subgraph[index];
            if (audienceIds.indexOf(item.audienceUuid) < 0) {
                audienceIds.push(item.audienceUuid);
            }
        }
        return audienceIds;
    }


    $scope.getSelectedStrategies = function (audienceUuid) {
        if (!$scope.subgraph) return [];
        var strategyIds = [];
        for (var index in $scope.subgraph) {
            var item = $scope.subgraph[index];
            if (item.audienceUuid === audienceUuid) {
                if (strategyIds.indexOf(item.strategyUuid) < 0) {
                    strategyIds.push(item.strategyUuid);
                }
            }
        }
        return strategyIds;
    }

    $scope.getUnSelectedAudiences = function () {
        var audienceIds = [];
        if ($scope.pool && $scope.pool.audiences) {
            for (var index in $scope.pool.audiences.node_label_index['Audience']) {
                var id = $scope.pool.audiences.node_label_index['Audience'][index];
                if (!$scope.pool.strategies || !$scope.pool.strategies.node_label_index || $scope.getSelectedStrategies(id).length !== $scope.pool.strategies.node_label_index['Strategy'].length) {
                    if (audienceIds.indexOf(id) < 0) {
                        audienceIds.push(id);
                    }
                }
            }
        }
        return audienceIds;
    }

    $scope.getUnSelectedStrategies = function (item) {
        var strategyIds = [];
        if ($scope.pool && $scope.pool.strategies) {
            for (var index in $scope.pool.strategies.node_label_index['Strategy']) {
                var id = $scope.pool.strategies.node_label_index['Strategy'][index];
                if (!$scope.subgraph || $scope.getSelectedStrategies(item).length === 0 || $scope.getSelectedStrategies(item).indexOf(id) < 0) {
                    strategyIds.push(id);
                }
            }
        }
        return strategyIds;
    }

    $scope.showRemoveIcon = function (item) {
        if (!$scope.pool.strategies) return true;
        return $scope.getUnSelectedStrategies(item).length == $scope.pool.strategies.node_label_index['Strategy'].length;
    }

    $scope.getAllStrategies = function () {
        var strategyIds = [];
        if ($scope.pool && $scope.pool.strategies) {
            for (var index in $scope.pool.strategies.node_label_index['Strategy']) {
                strategyIds.push($scope.pool.strategies.nodes[$scope.pool.strategies.node_label_index['Strategy'][index]].properties.uuid);
            }
        }
        return strategyIds;
    }

    $scope.showAudience = function () {
        return $scope.getUnSelectedAudiences().length > 0 ? true : false;
    }

    $scope.AddToLocal = function (audienceNode) {
        $scope.original = 'newtest';
        if (!$scope.subgraph) $scope.subgraph = [];
        var strategyUuids = [];
        for (var index in $scope.subgraph) {
            var item = $scope.subgraph[index];
            if (item.audienceUuid === audienceNode.properties.uuid && item.strategyUuid) {
                strategyUuids.push(item.strategyUuid);
            }
        }
        var allStrategies = $scope.getAllStrategies();
        for (var index in $scope.getAllStrategies()) {
            if (strategyUuids.indexOf(allStrategies[index]) < 0) {
                $scope.subgraph.push({
                    audienceUuid: audienceNode.properties.uuid,
                    strategyUuid: allStrategies[index]
                })
            }
        }
        $scope.setdata({ data: $scope.subgraph });
    }

    $scope.AddStrategyToLocal = function (strategyNode, audienceUuid) {
        if (!$scope.subgraph) $scope.subgraph = [];
        var isExist = false;
        for (var index in $scope.subgraph) {
            var item = $scope.subgraph[index];
            if (item.audienceUuid === audienceUuid && item.strategyUuid === strategyNode.properties.uuid) {
                isExist = true;
                break;
            }
        }
        if (!isExist) {
            $scope.subgraph.push({
                audienceUuid: audienceUuid,
                strategyUuid: strategyNode.properties.uuid
            })
        }
        $scope.setdata({ data: $scope.subgraph });
    }

    $scope.RemoveFromLocal = function (audienceNode) {
        var items = [];
        for (var index in $scope.subgraph) {
            var item = $scope.subgraph[index];
            if (item.audienceUuid === audienceNode.properties.uuid) {
                items.push(item);
            }
        }

        for (var index in items) {
            var item = items[index];
            var selIndex = $scope.subgraph.indexOf(item);
            $scope.subgraph.splice(selIndex, 1);
        }
        $scope.setdata({ data: $scope.subgraph });
    }

    $scope.RemoveStrategyFromLocal = function (strategyNode, audienceNode) {
        var items = [];
        for (var index in $scope.subgraph) {
            var item = $scope.subgraph[index];
            if (item.audienceUuid === audienceNode.properties.uuid && item.strategyUuid === strategyNode.properties.uuid) {
                items.push(item);
            }
        }

        for (var index in items) {
            var item = items[index];
            var selIndex = $scope.subgraph.indexOf(item);
            $scope.subgraph.splice(selIndex, 1);
        }
        $scope.setdata({ data: $scope.subgraph });
    }

    $scope.getStrategyType = function (item) {
        if (!item) return null;
        return item.properties.strategy_type ? "(" + item.properties.strategy_type + ")" : null;
    }

    $scope.Initialize();
}


function draggableCtrl($scope) {
    $scope.sortableOptions = {
        connectWith: ".connectPanels",
        handler: ".panel-body"
    };
}
