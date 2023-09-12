app.controller('TemplatesCtrl', function($http, $scope, $uibModal, sweetAlert, $rootScope) {
  $scope.templates = []

  $scope.Getting = true;

  $http.get('/api/template/all').then(resp => {
    $scope.templates = resp.data

    $scope.Getting = false;
  })
  .catch(error => console.error(error))


  $scope.DeleteTemplate = (template) => {
    sweetAlert.swal({
      title: "Delete this template?",
      // text: "You will not be able to recover this template!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, delete"
    }, confirmed => {
      if(confirmed) {
        $scope.Getting = true;

        $http.delete(`/api/template/${template.uuid}`)
        .then(resp => {
          let idx = $scope.templates.findIndex(t => t.uuid === template.uuid)
          $scope.templates.splice(idx, 1)

          $scope.Getting = false;
        })
        .catch(error => console.error(error))
      }
    });
  }

  $scope.CreateWorkshop = (template) => {
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Dashboard/Templates/_create_workshop.html',
      backdrop: 'static',
      keyboard: false,
      controller: function ($scope, $uibModalInstance) {
        $scope.template = {
          type: template.type,
          author: $rootScope.Person.properties.email,
          stages: template.stages.map(s => s.title),
          personas: template.personas.map(p => p.title),
          noteTypes: template.noteTypes.map(t => t.title),
          stageRelProps: JSON.parse(template.stageRelProps)
        };

        $scope.create = () => {
          $http.post('/api/template/createWorkshop', {
            templateUuid: template.uuid,
            workshopName: $scope.name,
            journeyAuthor: $rootScope.Person.properties.uuid,
            orders: JSON.parse(template.orders),
            stageRelProps: JSON.parse(template.stageRelProps)
          })
          .then(resp => {
            console.log(resp)
            $uibModalInstance.close();
          })
          .catch(err => console.error(err))
        }
        $scope.cancel = () => {
          $uibModalInstance.close();
        }
      }
    });
    modalInstance.result.then(data => {
      console.log(data)
    },
    () => {});
  }

  $scope.TemplateOverview = (template) => {
    console.log(template)
    var modalInstance = $uibModal.open({
      templateUrl: 'views/Dashboard/Templates/_template_overview.html',
      backdrop: 'static',
      keyboard: false,
      controller: function ($scope, $uibModalInstance) {
        $scope.template = template;

        $scope.cancel = () => {
          $uibModalInstance.close();
        }
      }
    });
    modalInstance.result.then(data => {
      console.log(data)
    },
    () => {
      console.log('hey now')
      // $log.info('Modal dismissed at: ' + new Date());
    });
  }

})
