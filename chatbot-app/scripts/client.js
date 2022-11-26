var connection = null;
var host = "127.0.0.1";
var port = "65432";

function startConnection() {
  var server = "ws://" + host + ":" + port + "/";

  connection = new WebSocket(server);
  console.log("***CREATED CONNECTION");
}
