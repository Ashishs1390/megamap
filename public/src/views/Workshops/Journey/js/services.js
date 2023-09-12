// Workshop Note properties to sort by
app.service('SortProperties', function() {
  return [{
    label: 'Importance',
    property: '-rels.votes_count'
  }, {
    label: 'Painful',
    property: '-rels.pains_count'
  }, {
    label: 'Interaction',
    property: 'rels.interaction.order'
  }, {
    label: 'Sample Size (VoC)',
    property: '-sample_size'
  }, {
    label: 'Average Importance (Quant)',
    property: '-average_importance'
  }, {
    label: 'Average Effectiveness (Quant)',
    property: '-average_effectiveness'
  }, {
    label: 'Gap (Eff - Imp)',
    property: '-gap'
  }, {
    label: 'Comments',
    property: '-rels.comments_count'
  }, {
    label: 'Author',
    property: 'rels.author.firstname'
  }, {
    label: 'Sequence/Step/Priority',
    property: 'order_in_sequence'
  }, {
    label: 'MOT notes',
    property: '-mot'
  }]
})

// app.directive('mySlider', function() {
//   return {
//     restrict: 'A',
//     scope: {
//       'model': '='
//     },
//     link: function(scope, elem, attrs) {
//       $(elem).slider({
//         value: +scope.model,
//         slide: function(event, ui) {
//           scope.$apply(function() {
//             scope.model = ui.value;
//             });
//            }
//          });
//        }
//       };
//  });
