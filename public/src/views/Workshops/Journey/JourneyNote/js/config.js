app.controller('journeyNoteCardCtrl', journeyNoteCardCtrl)
app.directive('journeyNoteCard', journeyNoteCard)

function journeyNoteCard() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/Workshops/Journey/JourneyNote/note.html',
        scope: {
            note: '=',
            journeySubGraph: '='
        },
        controller: journeyNoteCardCtrl
    }
}