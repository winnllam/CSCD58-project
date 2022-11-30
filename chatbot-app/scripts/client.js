var dgram = require("dgram");
const { Buffer } = require("node:buffer");
const struct = require("python-struct");
const packetType = "!HHIIBBHHHII";
const packetIndices = {
  sourcePort: 0,
  destPort: 1,
  sequence: 2,
  ack: 3,
  data: 4,
  flags: 5,
  window: 6,
  checksum: 7,
  urgent: 8,
  options: 9,
  data: 10,
};

var host = "127.0.0.1";
var send_port = 65432;
var listen_port = 65433;

window.startConnection = function () {
  var client = dgram.createSocket("udp4");
  client.bind(listen_port, host);

  // const message = Buffer.from("Hello World");
  // client.send(message, send_port, host, (err) => {});

  // TODO: 1234 - should be listen_port?
  var pkt = new TCPPacket(listen_port, send_port, 1, 1);
  pkt.updateProp("syn", 1);
  console.log("Client is sending the following packet:");
  console.log(pkt);
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
    console.log(
      "Received %d bytes from %s:%d\n",
      msg.length,
      info.address,
      info.port
    );

    // TODO: Decode the data
    // struct.sizeOf(packetType);
    // var data = struct.unpack(packetType, Buffer.from(msg, "hex"));
    var data = pkt.decode(msg);
    console.log(
      "Decoded struct is " +
        data +
        " which is type of " +
        typeof data +
        " with properties " +
        Object.keys(data)
    );
    console.log("Flag is " + data[packetIndices.flags]);
    // Decoded struct is 1234,65432,1,1,0,0,0,0,0,0,0 which is type of objectwith properties 0,1,2,3,4,5,6,7,8,9,10

    // Check if the syn = ack = 1
  });
};

class TCPPacket {
  constructor(
    src_port,
    dst_port,
    seq_num,
    ack_num,
    cwr = 0,
    ece = 0,
    urg = 0,
    ack = 0,
    psh = 0,
    rst = 0,
    syn = 0,
    fin = 0,
    checksum = 0,
    options = 0,
    data = 0
  ) {
    this.src_port = src_port;
    this.dst_port = dst_port;
    this.seq_num = seq_num;
    this.ack_num = ack_num;
    this.cwr = cwr;
    this.ece = ece;
    this.urg = urg;
    this.ack = ack;
    this.psh = psh;
    this.rst = rst;
    this.syn = syn;
    this.fin = fin;
    this.checksum = checksum;
    this.options = options;
    this.data = data;
  }

  encode() {
    var flags =
      this.cwr.toString() +
      this.ece.toString() +
      this.urg.toString() +
      this.ack.toString() +
      this.psh.toString() +
      this.rst.toString() +
      this.syn.toString() +
      this.fin.toString();

    var flagDecimal = parseInt(flags, 2);

    return struct.pack(
      "!HHIIBBHHHII",
      this.src_port,
      this.dst_port,
      this.seq_num,
      this.ack_num,
      0,
      flagDecimal,
      0,
      0,
      0,
      this.options,
      this.data
    );
  }

  decode(data) {
    var unpacked = struct.unpack(packetType, Buffer.from(data, "hex"));
    return unpacked;
  }

  updateProp(prop, newValue) {
    this[prop] = newValue;
  }

  flags(flagNum) {
    var flagBinary = flagnum.toString(2);
  }
}
