app.controller('LandingCtrl', function($scope){
  $scope.plans = [
    {
      id: 1,
      name: 'Basic',
      price: '$16',
      features: ['Dashboards', 'Projects view', 'Contacts', 'Calendar', 'AngularJs'],
      description: 'Lorem ipsum dolor sit amet, illum fastidii dissentias quo ne. Sea ne sint animal iisque, nam an soluta sensibus.'
    },
    {
      id: 1,
      name: 'Standard',
      price: '$22',
      features: ['Dashboards', 'Projects view', 'Contacts', 'Calendar', 'AngularJs'],
      description: 'Lorem ipsum dolor sit amet, illum fastidii dissentias quo ne. Sea ne sint animal iisque, nam an soluta sensibus.'
    },
    {
      id: 1,
      name: 'Premium',
      price: '$160',
      features: ['Dashboards', 'Projects view', 'Contacts', 'Calendar', 'AngularJs'],
      description: 'Lorem ipsum dolor sit amet, illum fastidii dissentias quo ne. Sea ne sint animal iisque, nam an soluta sensibus.'
    },
    {
      id: 1,
      name: 'Prestige',
      price: '$260',
      features: ['Dashboards', 'Projects view', 'Contacts', 'Calendar', 'AngularJs'],
      description: 'Lorem ipsum dolor sit amet, illum fastidii dissentias quo ne. Sea ne sint animal iisque, nam an soluta sensibus.'
    }
  ]
});
