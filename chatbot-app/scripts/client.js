var dgram = require("dgram");
const { Buffer } = require("node:buffer");
const struct = require("python-struct");
const packetType = "!HHIIBHHHHII";

var host = "127.0.0.1";
var send_port = 65432;
var listen_port = 65433;

window.startConnection = function () {
  var client = dgram.createSocket("udp4");
  client.bind(listen_port, host);

  // const message = Buffer.from("Hello World");
  // client.send(message, send_port, host, (err) => {});

  var pkt = new TCPPacket(1234, send_port, 1, 1);
  console.log("Client is sending the following packet:");
  console.log(pkt.encode());
  client.send(pkt.encode(), send_port, host, (err) => {});

  console.log("Info sent");

  // TODO: Figure out if this is even needed tbh
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
    // struct.sizeOf(packetType);
    // var data = struct.unpack(packetType, Buffer.from(msg, "hex"));
    // console.log("Decoded struct is " + data);
    var data = pkt.decode(msg);
  });
};

class TCPPacket {
  constructor(
    src_port,
    dst_port,
    seq_num,
    ack_num,
    flags = 0,
    checksum = 0,
    options = 0,
    data = 0
  ) {
    this.src_port = src_port;
    this.dst_port = dst_port;
    this.seq_num = seq_num;
    this.ack_num = ack_num;
    this.flags = flags;
    this.checksum = checksum;
    this.options = options;
    this.data = data;
  }

  encode() {
    return struct.pack(
      "!HHIIBHHHHII",
      this.src_port,
      this.dst_port,
      this.seq_num,
      this.ack_num,
      0,
      this.flags,
      0,
      0,
      0,
      this.options,
      this.data
    );
  }

  decode(data) {
    return struct.unpack(packetType, Buffer.from(data, "hex"));
  }
}
