app.service('loader', function ($interval) {
    let obj = {
        value: 0,
        full: false,
        faker: null,
        start:0,
        stop:0,
        upper:0,
        lower:0,
        frequency:0,
        setValue: function (val) {
            this.value = val;
            this.value = Math.min(100, this.value);
            this.value = Math.max(0, this.value);
            this.full = this.value == 100;
            this.empty = this.value == 0;
        },
        incrementValue: function (val) {
            this.setValue(this.value + val);
        },
        fakeLoad: function (start, stop, upper, lower, frequency) {
            this.setValue(start);
            if (this.faker != null) {
                $interval.cancel(this.faker);
                this.faker = null;
            }
            this.faker = $interval(this.fakeIntervals, frequency)
        },
        fakeIntervals:function(){
            if (this.value < stop) { $scope.progress += Math.floor(Math.random() * 25 - 5); } else { $interval.cancel($scope.loader); }
        },

    }
    return obj;
});
   
           
        

