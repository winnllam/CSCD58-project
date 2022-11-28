var dgram = require("dgram");
var host = "127.0.0.1";
var send_port = 65432;
var listen_port = 65433;
const { Buffer } = require("node:buffer");

function startConnection() {
  var client = dgram.createSocket("udp4");
  client.bind(listen_port, host);

  const message = Buffer.from("Hello World");
  client.send(message, send_port, host, (err) => {
    client.close();
  });

  console.log("Info sent");

  client.on("listening", function () {
    var address = client.address();
    console.log(
      "UDP Server listening on " + address.address + ":" + address.port
    );
  });

  client.on("message", function (message, remote) {
    console.log(remote.address + ":" + remote.port + " - " + message);
  });
}
