// app.factory('socket', function ($rootScope) {
//     const SOCKET_URL = $rootScope.api;
//     return function ($scope) {
//         $scope.$on("$destroy", () => {
//             obj.destroy();
//         });
//         let obj = {
//             socket: null,
//             connect: function (ns) {
//                 this.socket = io.connect(SOCKET_URL, {
//                     query: 'ns=' + ns,
//                     resource: "socket.io",
//                     url: SOCKET_URL
//                 })
//             },
//
//             on: function (eventName, callback) {
//                 this.socket.on(eventName, function () {
//                     var args = arguments;
//                     $rootScope.$apply(function () {
//                         callback.apply(this.socket, args);
//                     });
//                 });
//             },
//             emit: function (eventName, data, callback) {
//                 this.socket.emit(eventName, data, function () {
//                     var args = arguments;
//                     $rootScope.$apply(function () {
//                         if (callback) {
//                             callback.apply(this.socket, args);
//                         }
//                     });
//                 });
//             },
//             destroy: function () {
//                 this.socket.disconnect();
//                 this.socket = null;
//             }
//         }
//         return obj;
//     }
// });
