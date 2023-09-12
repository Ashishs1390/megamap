app.service('Alert', function(sweetAlert){
  return {
    error: function(message){
      sweetAlert.swal({
        title: "Error!",
        text: message,
        type: "error"
      });
    },
    warning: function(message){
      sweetAlert.swal({
        title: "Warning!",
        text: message,
        type: "error"
      });
    },
    note: function(message){
      sweetAlert.swal({
        title: "Note!",
        text: message,
        type: "warning"
      });
    }
  }
})
