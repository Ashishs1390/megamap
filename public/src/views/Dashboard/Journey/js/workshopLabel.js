app.directive('workshopLabel', () => {
  return {
    restrict: 'E',
    replace: true,
    template: `
      <div class="label workshop-label gold--with-margin pull-left"
        ng-class="{
          'orange':workshopType=='journey',
          'green':workshopType=='persona',
          'blue':workshopType=='brainstorm',
          'yellow':workshopType=='adoption',
          'pink':workshopType=='learning',
          'brown':workshopType=='horizon',
          'gray':workshopType=='group'
        }">
        {{(group ? workshopType + ' (group)' : workshopType) | titleCase}}
      </div>
    `,
    scope: {
        workshopType: '=',
        group: '='
    }
  }
})
