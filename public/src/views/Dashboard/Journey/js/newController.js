app.controller('JourneyCtrl', function (Scores, $timeout, $stateParams, sweetAlert,$location, $window, $rootScope, Activity, $http, $scope, $state, DynamicJourneyFields, $uibModal) {
    $scope.scores = Scores;
    $scope.workshopType = $state.current.name.split('.')[1];
    $scope.count = 0;
    $scope.counter = 0;
    $scope.journeysArr = [];
    $scope.search = '';
    $scope.busy = false;

    $scope.ExportCsv = (uuid, template = false) => {
      $window.open(`/api/stats/csv/${uuid}${template ? '?template=true' : ''}`)
    }

    $scope.uploadCsvModal = (journey) => {
      uploadCsvModal($uibModal, journey, (success) => $state.reload());
    }

    if ($rootScope.Person.role == "tenant" || $rootScope.Person.role == "admin") {
        $scope.params = $location.path().split('/')[2] || 'journey';
    } else {
        $scope.params = "alldata";
    }
    if ($stateParams.filtered && $stateParams.journeys) {
        $http.post('/api/journey/filtered', {
            uuids: $stateParams.journeys.split('_')
        }).then(function (resp) {
            $scope.journeys = resp.data;
        }).catch(function (err) {
            console.log(err)
            $scope.journeys = [];
        })
    } else {
        var params = {
            journeyType: $scope.params,
            searchTerm:''
        }
        $http({ method: 'GET', url: '/api/journey/count', params }).then(function (resp) {
            $scope.count = resp.data.count;
        }).catch(function (err) {
            console.log(err)
        });

        //infinite scroll
        $scope.loadMore = function () {
            if ($scope.busy) return;
            $scope.busy = true;
            var params = {
                skip: $scope.counter,
                limit: 9,
                journeyType: $scope.params,
                searchTerm:$scope.search
            };
            if ($scope.counter <= $scope.count) {
                $scope.loadingJourneys = true;
                $http({ method: 'GET', url: '/api/journey/all', params }).then(function (resp) {
                    $scope.journeysArr.push(...resp.data);
                    $scope.journeys = $scope.journeysArr;
                    $scope.counter += 9;
                    $scope.busy = false;
                }).catch(function (err) {
                    console.log(err)
                    $scope.journeys = [];
                })
                .finally(() => {
                  $scope.loadingJourneys = false;
                })
            } else {
                $scope.counter = 0;
            }


            if($scope.searchTerm == ""){
                $scope.busy = false;
                $scope.counter = 0;
            }
        };

    }

    $scope.showAll = function () {
        return (($rootScope.Person.role === 'attendee' || $rootScope.Person.role === 'external') || $stateParams.filtered);
    };
    $scope.users = [];
    $scope.addUsers = function (journey,subdomain) {
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Dashboard/Journey/addattendee.html',
      backdrop: 'static',
      keyboard: false,
      controller: function( $scope, $uibModalInstance ) {
        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
        $scope.inviteCreate = function () {
          var sure = confirm("Email invites will be sent to each user. Continue?");

          if (sure == true) {
            $scope.create(true)
          }
        }
        $scope.create = function (invite = false) {
          let users = {};
          let mailList = [];
          let attendees = $scope.users.split(/\r\n|\r|\n/g).reduce((filtered, string) => {
            let user = {}

            // filter: return if true and if formated as an email address
    				if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(string)) {
    					user.email = string.toLowerCase();
              mailList.push(user.email)
    					filtered.push(user)
    				}
    				return filtered;
    			}, []);

          users.uuid= journey.uuid;
          users.attendees = attendees;

          $http.post('/api/node/bulk/addition', {
            users: users
          })
          .then(function (resp) {
            if(invite) {
              $http.post('/api/journey/invite', {
                emails: mailList,
                inviteTo: journey,
                origin: $window.location.origin
              })
              .then(function (resp) {
                console.log('emails sent')
              })
              .catch(function (err) {
                console.log('emails not sent')
              })
              .finally(function (resp) {
                sweetAlert.swal({
                  title: "Success!",
                  text: "Users added successfully!",
                  type: "success",
                }, function (isConfirm) {
                  $uibModalInstance.close();
                })
              });
            }
          })
          .catch(function (err) {
            console.log(err);
          })
          .finally(function (resp) {
            sweetAlert.swal({
              title: "Success!",
              text: "Users added successfully!",
              type: "success",
            }, function (isConfirm) {
              $uibModalInstance.close();
            })
          });
        }
      }
    });
    modalInstance.result.then(function(resp) {
    }, function () {
      console.log('modal closed')
    });
    };

    // $scope.addUsers = function(){

    // }



    var delayTimerSearch = "";
    $scope.searchPause = true;

    $scope.fetchJourneyOnSearch = function(){

        $scope.counter = 0;
        $scope.busy = false;
        if($scope.search !="" ){
            $scope.searchPause = true;
        }
        clearTimeout(delayTimerSearch);
        delayTimerSearch = setTimeout(function() {
           if ($scope.busy) return;
            $scope.busy = true;
            $scope.journey = [];
            $scope.journeysArr = [];
            if($scope.searchPause){
                var params = {
                    skip: $scope.counter,
                    limit: 9,
                    journeyType: $scope.params,
                    searchTerm:$scope.search
                };

                if ($scope.counter <= $scope.count) {
                    $http({ method: 'GET', url: '/api/journey/all', params }).then(function (resp) {

                        $scope.journeysArr.push(...resp.data);
                        $scope.journeys = $scope.journeysArr;

                        // console.log($scope.journeys)
                        $scope.counter += 9;
                        $scope.busy = false;
                        if($scope.search == "" || $scope.search == undefined) {
                            $scope.searchPause = false;
                        } else {
                            $scope.searchPause = true;
                        }

                    }).catch(function (err) {
                        console.log(err)
                        $scope.journeys = [];
                    })

                    $http({ method: 'GET', url: '/api/journey/count', params })
                    .then((nodes)=>{
                        $scope.count = nodes.data.count;
                    })
                }
            }


        }, 600);
    }

    $scope.workshopTail = function () {
      switch ($scope.workshopType) {
        case 'journey':
          return ' Maps';
        case 'persona':
          return ' Profiles';
        case 'brainstorm':
          return 'ing';
        case 'adoption':
          return ' Patterns';
        case 'learning':
          return ' Paths';
        case 'horizon':
          return ' Maps';
        default:
          return ''
      }
    }

    $scope.message = 'journey page';

    $scope.showWorkshopType = {
        journey:    $scope.workshopType === 'journey',
        persona:    $scope.workshopType === 'persona',
        brainstorm: $scope.workshopType === 'brainstorm',
        adoption:   $scope.workshopType === 'adoption',
        learning:   $scope.workshopType === 'learning',
        horizon:    $scope.workshopType === 'horizon'
    }

    if (true || $rootScope.Person.role === 'attendee' || $rootScope.Person.role === 'external') {
        $scope.showWorkshopType = {
            journey:    true,
            persona:    true,
            brainstorm: true,
            adoption:   true,
            learning:   true,
            horizon:    true
        }
    }

    $scope.openAboutModal = function (workshop) {
        var modalInstance = $uibModal.open({
            templateUrl: 'views/Dashboard/Journey/about.html',
            controller: function ($scope, workshop, $uibModalInstance) {
                $scope.workshop = workshop;
                $scope.close = function () {
                    $uibModalInstance.close(null)
                }
            },
            resolve: {
                workshop: function () { return workshop }
            },
            backdrop: 'static',
            keyboard: false,
        });
    }

    $scope.PopEditModal = (data, interactions) => {
        $rootScope.currentJourneyInteractions = interactions;

        PopJourneyEditModal(data, DynamicJourneyFields, $uibModal, () => $state.reload());
    }

    $scope.PopCreateModal = (data, workshopType = $scope.workshopType) => {
      PopJourneyCreateModal(data, DynamicJourneyFields, $uibModal, workshopType);
    }
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);
    $scope.PopConnectModal = (data) => PopJourneyConnectModal(data, $uibModal);
    $scope.PopAttendeeModal = (data, external = false) => PopJourneyAttendeeModal(data, external, $uibModal);
    $scope.PopQuickReportModal = (data) => PopJourneyQuickReportModal(data, $uibModal);

    $scope.ViewReport = function (item, type, group = false) {
      let params = { uuid: item }
      if(group) params.group = true;

        if (type && type === 'persona') {
            $state.go("reports.profile", params);
        } else {
            $state.go("reports.journey", params);
        }
        Activity.log(item, 'view report', 'last_active_at');
    }

    $scope.EAReport = function ( uuid ) {
      let host = $window.location.origin.replace('cx', 'ai')

      $window.open( `${host}/admin/report?journey=${uuid}` )
    }

    $scope.UsageReport = function ( uuid ) {
      let host = `https://${$rootScope.subdomain}.usage.ruptive.cx`

      $window.open( `${host}?uuid=${uuid}` )
    }


    $timeout(function () { $('#filter').focus(); });
})
app.directive("directiveWhenScrolled", function () {
    return function (scope, elm, attr) {
        var raw = elm[0];

        elm.bind('scroll', function () {
            console.log(raw.scrollTop);
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                scope.$apply(attr.directiveWhenScrolled);
            }
        });
    };
});




        //pagination with plugin
        // $scope.skip = 1;
        // $scope.paginate = function (pageNo) {
        //     console.log(pageNo);
        //     var startIndex = (pageNo - 1) * 5;
        //     var endIndex = Math.min(startIndex + 5 - 1, $scope.count - 1);
        //     console.log(startIndex);
        //     console.log(endIndex);
        //     $scope.skip += 5;
        //     var params = {
        //         skip: startIndex,
        //         limit: 5,
        //         journeyType: 'journey'
        //     };
        //     console.log(params);
        //     $http({ method: 'GET', url: '/api/journey/all', params }).then(function (resp) {
        //         console.log($scope.journeyWorkshop);
        //         $scope.journeys = resp.data;
        //     }).catch(function (err) {
        //         console.log(err)
        //         $scope.journeys = [];
        //     })
        // }

        //pagination without plugin
        // $scope.paginate = function (param) {
        //     console.log($scope.count);
        //     if (param == "prev" && $scope.start > 1) {
        //         $scope.end -= 5;
        //         $scope.start -= 5;
        //         var params = {
        //             skip: $scope.start,
        //             journeyType: 'journey'
        //         };
        //         $http.get('/api/journey/count').then(function (resp) {
        //             console.log(resp);
        //             $scope.count = resp.data.count;

        //         }).catch(function (err) {
        //             console.log(err)
        //         });
        //         $http({ method: 'GET', url: '/api/journey/all', params }).then(function (resp) {
        //             console.log(resp);
        //             $scope.journeys = resp.data;

        //         }).catch(function (err) {
        //             console.log(err)
        //             $scope.journeys = [];
        //         });



        //     }
        //     else if (param == "next" && $scope.count > $scope.end) {
        //         $scope.end += 5;
        //         $scope.start += 5;
        //         var params = { skip: $scope.start, journeyType: 'journey' }
        //         $http.get('/api/journey/count').then(function (resp) {
        //             $scope.count = resp.data.count;

        //         }).catch(function (err) {
        //             console.log(err)
        //         });
        //         $http({ method: 'GET', url: '/api/journey/all', params }).then(function (resp) {
        //             console.log(resp);
        //             $scope.journeys = resp.data;
        //             // $state.reload();

        //         }).catch(function (err) {
        //             console.log(err)
        //             $scope.journeys = [];
        //         });


        //     }
        //     else {
        //         return false;
        //     }
        // }
