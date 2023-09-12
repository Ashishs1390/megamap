app.directive('singleSubscriber', singleSubscriber);
app.directive('multiSubscriber', multiSubscriber);
app.directive('multiSubscriberForAudience', multiSubscriberForAudience);
app.directive('multiSubscriberForBullsEye', multiSubscriberForBullsEye);
app.directive('multiSubscriberGrid', multiSubscriberGrid);
app.controller("draggableCtrl", draggableCtrl);

app.factory("attendeeDataSubmitService",function(){
    let submitData = [];
    let addData = function(data){
        submitData = data;
    }

    let getData = function(){
        return  submitData;  
    }
    
    return {
        addData:addData,
        getData:getData
    }
});

app.factory("attendeeDataAddToLocalService",function(){
    let submitData = [];
    let addData = function(data){
        submitData = data;
    }

    let getData = function(){
        return  submitData;  
    }
    
    return {
        addData:addData,
        getData:getData
    }
});


function singleSubscriber() {
    return {
        restrict: 'E',
        templateUrl: 'views/Shared/Subscribers/single.html',
        scope: {
            subgraph: '=',
            label: '=',
            pivot: '=',
            type: '=',
            original: '=',
            pool: '=?',
            whereKey: '=?',
            whereVal: '=?',
            whereType: '=?'
        }
    }
}

function multiSubscriber() {
    return {
        restrict: 'E',
        templateUrl: 'views/Shared/Subscribers/multi.html',
        scope: {
            subgraph: '=',
            label: '=',
            pivot: '=',
            type: '=',
            original: '=',
            pool: '=?',
            whereKey: '=?',
            whereVal: '=?',
            whereType: '=?'
        }
    }
}

function multiSubscriberForAudience() {
    return {
        restrict: 'E',
        templateUrl: 'views/Shared/Subscribers/multi-audience.html',
        scope: {
            subgraph: '=',
            label: '=',
            pivot: '=',
            type: '=',
            original: '=',
            pool: '=?',
            whereKey: '=?',
            whereVal: '=?',
            whereType: '=?'
        }
    }
}

function multiSubscriberForBullsEye() {
    return {
        restrict: 'E',
        templateUrl: 'views/Shared/Subscribers/multi-bullseyeconnection.html',
        scope: {
            subgraph: '=',
            label: '=',
            pivot: '=',
            type: '=',
            original: '=',
            setdata: '&',
            pool: '=?',
            whereKey: '=?',
            whereVal: '=?',
            whereType: '=?'
        }
    }
}

function multiSubscriberGrid() {
    return {
        restrict: 'E',
        templateUrl: 'views/Shared/Subscribers/multi-cards.html',
        scope: {
            subgraph: '=',
            node: '=',
            label: '=',
            pivot: '=',
            journey: '=',
            type: '=',
            original: '=',
            pool: '=?',
            whereKey: '=?',
            whereVal: '=?',
            whereType: '=?'
        }
    }
}
