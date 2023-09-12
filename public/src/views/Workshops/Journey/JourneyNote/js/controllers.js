
function journeyNoteCardCtrl($scope, $http, $rootScope, $stateParams, $state, notify, sweetAlert, JourneyWorkshopAPI, $uibModal, $timeout) {
    $scope.voice_of_customer = false;
    $scope.comments_loaded = false;
    $scope.note.comments = [];
    $scope.reply = "";

    $scope.$on("post.comment_"+$scope.note.uuid, (event, data) => {
      console.log('post comment.. ', event, data);
      $scope.note.comments_count = data.count

      $scope.note.comments.push(data)
    })
    $scope.$on("update.note_"+$scope.note.uuid, (event, data) => {
      console.log('\n\n\nupdating note..\n\n\n\n' , $scope.note);
      Object.keys(data).forEach(function(key){
        $scope.note[key] = data[key]
      })
    })
    $scope.$on("delete.note_"+$scope.note.uuid, (event, data) => {
      $scope.note = null;
    })

    // load comments. not ideal way to handle this.
    $scope.getComments = function(note_uuid){
        console.log('getting comments.... \n\n\n\n\'');
        if(($scope.note.comments_count > 0) && ($scope.note.comments.length == 0)){
        console.log('loading comments')
        $http({
          method: 'GET',
          url: '/api/journey/note/'+$scope.note.uuid+'/comments',
          params: { 'nocache': new Date().getTime() }
        }).then(function(resp){
          $timeout(function(){
            $scope.note.comments = resp.data;
            $scope.comments_loaded = true;
            console.log('comments loaded')
          })
        })
      }
      return
    }

    $scope.vote = function (str, uuid) {
      $http({
        method: 'POST',
        url: '/api/journey/note/vote',
        headers: { 'journey': $stateParams.id },
        data: { uuid: uuid, str: str }
      })
      .then(function(resp){
        $scope.note['user_'+str] = !$scope.note['user_'+str];
        // console.log(resp.data)
      }).catch(function(err){
        console.error(err);
      })
    }

    $scope.post_reply = function () {

        $scope.replying = true;
        // Prevent user from mannurally insert [VoC] or [VOC] at index of 0 and 1 of a comment,
        // but still alow them to type 'VoC' in after that.
        // || $scope.reply.toLowerCase().indexOf('[voc]') <=1
        if ($scope.reply.length < 3) {
            $scope.replying = false;
            return;
        }
        var rel = {
            from_id: $rootScope.Person.properties.uuid,
            to_id: $scope.note.uuid,
            type: "comment",
            properties: {
                comment: $scope.voice_of_customer ? '[VoC] ' + $scope.reply : $scope.reply,
                uuid: uuidv4()
            }
        };
        JourneyWorkshopAPI.PostComment(rel).then(() => {
            $scope.voice_of_customer = false;
            $scope.reply = '';
        });
    }

}
