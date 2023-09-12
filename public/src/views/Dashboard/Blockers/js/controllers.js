function blockersTenantCtrl($scope, $http, Alert, $uibModal, BlockersManagementAPI, $state) {
    //Get Local Library
    $scope.Getting = true;
    $scope.search = '';
    BlockersManagementAPI.GetRelationsOfTypeWithLabelWhere(
        'Note',
        'note_interaction',
        'Interaction',
        'to.title',
        'Blockers',
        'from'
    )
    .then(function(blockers) {
        console.log(blockers);
        $scope.Getting = false;
        $scope.library = blockers;
    }).catch(function(err) {
        $scope.Getting = false;
        Alert.note(err.message)
    });


    //Set Controller accessible Modals
    $scope.PopEditModal = (data) => PopBlockersEditModal(data, $uibModal);
    $scope.PopOverviewModal = (data) => PopNodeOverviewModal(data, $uibModal);

}
