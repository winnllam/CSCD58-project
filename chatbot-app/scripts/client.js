var socket = null;
var host = "127.0.0.1";
var port = "65432";

function startConnection() {
  var server = "ws://" + host + ":" + port + "/";

  socket = new WebSocket(server);
  console.log("***CREATED CONNECTION");

  // Listen for messages
  socket.addEventListener("message", (event) => {
    console.log("Recieved message from server ", event.data);
  });
}
