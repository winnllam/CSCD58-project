var dgram = require("dgram");
var host = "127.0.0.1";
var port = 65432;
const { Buffer } = require("node:buffer");

// Documentation: https://nodejs.org/api/dgram.html

function startConnection() {
  var client = dgram.createSocket("udp4");

  const message = Buffer.from("Hello World");
  client.send(message, port, host, (err) => {
    client.close();
  });
}
