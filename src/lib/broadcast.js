const fanout = require("./fanout");

module.exports = (channel, payload) => {
  console.log(channel, payload)
  fanout.publish(channel, payload, (success, message, context) => {
    // console.log('fanout new publish: ', success, message, context)
  });
};


//     pubnub.publish({ channel: thread, message: payload }, (status, response) => {
//       console.log(status);
//       console.log(response);
//     }
