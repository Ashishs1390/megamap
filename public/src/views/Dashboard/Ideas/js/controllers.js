function ideasTenantCtrl($scope, $http, Alert, $uibModal, IdeasManagementAPI, $state) {
    //Get Local Library
    $scope.Getting = true;
    $scope.search = '';
    IdeasManagementAPI.GetRelationsOfTypeWithLabelWhere(
        'Note',
        'note_interaction',
        'Interaction',
        'to.title',
        'Ideas',
        'from'
    )
    .then(function(ideas) {
        console.log(ideas);
        $scope.Getting = false;
        $scope.library = ideas;
    }).catch(function(err) {
        $scope.Getting = false;
        Alert.note(err.message)
    });


    //Set Controller accessible Modals
    $scope.PopEditModal = (data) => PopIdeasEditModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);

}
