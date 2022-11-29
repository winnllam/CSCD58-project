var dgram = require("dgram");
const { Buffer } = require("node:buffer");
const struct = require("python-struct");

var host = "127.0.0.1";
var send_port = 65432;
var listen_port = 65433;

function startConnection() {
  var client = dgram.createSocket("udp4");
  client.bind(listen_port, host);

  const message = Buffer.from("Hello World");
  client.send(message, send_port, host, (err) => {});

  console.log("Info sent");

  client.on("listening", function () {
    var address = client.address();
    console.log(
      "UDP Server listening on " + address.address + ":" + address.port
    );
  });

  client.on("message", function (msg, info) {
    console.log("Data received from server : " + msg);
    console.log(
      "Received %d bytes from %s:%d\n",
      msg.length,
      info.address,
      info.port
    );

    // TODO: Decode the data
    struct.sizeOf("!HHIIBHHHHII");
    var data = struct.unpack("!HHIIBHHHHII", Buffer.from(msg, "hex"));
    console.log("Decoded struct is " + data);
  });
}
