var dgram = require("dgram");
var host = "127.0.0.1";
var port = 65432;

function startConnection() {
  var client = dgram.createSocket("udp4");
  console.log(port);

  client.connect(port, host);
  console.log("***CREATED CONNECTION");
}
