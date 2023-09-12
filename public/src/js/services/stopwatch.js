app.component('stopwatch', {
  template: `
    <div class="stopwatch" track="false" ng-if="!['attendee', 'external'].includes($root.Person.role)">
      <h4 ng-class="{'text-red': true}">{{countdown}}</h4>
      <div>
        <div class="stopwatch-actions btn-group">
          <a class="btn btn-primary btn-sm" ng-click="active ? '' : $ctrl.start(0)" ng-disabled="active">
            <i class="fa fa-play fa-fw"></i>
          </a>
          <a class="btn btn-primary btn-sm" ng-click="$ctrl.pause(1)">
            <span><i class="fa fa-pause fa-fw"></i></span>
          </a>
          <a class="btn btn-primary btn-sm" ng-click="$ctrl.stop(2)">
            <i class="fa fa-stop fa-fw"></i>
          </a>
        </div>
        <div class="minute-tick">
          <a ng-click="active ? '' : $ctrl.increment(3)">
            <i class="fa fa-caret-up fa-fw"></i>
          </a>
          <a ng-click="active ? '' : $ctrl.decrement(4)">
            <i class="fa fa-caret-down fa-fw"></i>
          </a>
        </div>
      </div>
    </div>
  `,
  bindings: {
    minutes: '<',
    action:  '<'
  },
  controller: StopWatchCtrl
});

function StopWatchCtrl($scope, $http, $timeout, moment, $stateParams, $uibModal) {
  $scope.active = false;
  $scope.countdown;

  let timer, duration;

  const setStart = (minutes = this.minutes) => {
    console.log(minutes)
    if(minutes < 1) minutes = 1;
    $scope.minutes = minutes;

    duration = moment.duration({
      'minutes': $scope.minutes
    });

    $timeout(() => {
      $scope.countdown = duration.format('mm:ss', { trim: false });
    })
  }

  setStart()

  this.increment = () => setStart(++$scope.minutes)
  this.decrement = () => setStart(--$scope.minutes)

  this.start = () => {
    $scope.active = true;

    timer = setInterval(() => {
      duration.subtract(1, 'seconds')

      $timeout(() => {
        $scope.countdown = duration.format('mm:ss', { trim: false });
      })
      if($scope.countdown == '00:01') {
        $timeout(this.pause)
        this.broadcast(5)
      }
    }, 1000);
  }

  this.pause = () => {
    $scope.active = false;

    clearInterval(timer)
  }
  this.stop = () => {
    $scope.active = false;

    clearInterval(timer)
    setStart()
  }

  this.broadcast = (action) => {
    // 0 = start, 1 = pause, 2 = stop, 3 = increment, 4 = decrement, 5 = timesup
    if([3, 4].includes(action)) {
      action = `${action}-${Date.now()}`
    }
    $http.post('/api/publish', {
      channel: $stateParams.id,
      payload: {
        "workshop.countdown": action
      }
    })
  }

  this.$onChanges = (changes) => {
    if(changes.action && changes.action.currentValue != changes.action.previousValue) {
      // parse action from timestamped broadcast
      if(typeof(changes.action.currentValue) === 'string') {
        changes.action.currentValue = parseInt(changes.action.currentValue[0])
      }
      switch(changes.action.currentValue) {
        case 0: this.start();     break;
        case 1: this.pause();     break;
        case 2: this.stop();      break;
        case 3: this.increment(); break;
        case 4: this.decrement(); break;
        case 5: this.timesup();   break;
      }
    }
  };

  this.timesup = () => {
    $uibModal.open({
      size: 'sm',
      backdrop: 'static',
      template: `
        <div class="modal-body text-center">
          <h2>Time is Up!</h2>
          <br>
        </div>
        <div class="modal-footer">
          <button class="btn btn-block btn-sm btn-primary" type="button" ng-click="ok()">OK</button>
        </div>
      `,
      controller: function($scope, $uibModalInstance) {
        $scope.ok = () => {
          $uibModalInstance.dismiss()
        }
      }
    });
  }
}
