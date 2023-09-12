app.controller('profileNoteCardCtrl', profileNoteCardCtrl)
app.directive('profileNoteCard', profileNoteCard)

function profileNoteCard() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Workshops/Profile/ProfileNote/note.html',
        scope: {
            note: '=',
            profileSubGraph: '='
        },
        controller: profileNoteCardCtrl
    }
}