var dgram = require("dgram");
const { Buffer } = require("node:buffer");
const struct = require("python-struct");
const packetType = "!HHIIBBHHHII";
const packetIndices = {
  sourcePort: 0,
  destPort: 1,
  seq_num: 2,
  ack_num: 3,
  data_offset: 4,
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
    // var data = pkt.decode(msg);
    // console.log(
    //   "Decoded struct is " +
    //     data +
    //     " which is type of " +
    //     typeof data +
    //     " with properties " +
    //     Object.keys(data)
    // );

    // Update with new things:
    pkt.updateRecieveData(data);

    // TODO: Remove Decoded struct is 65432,65433,2,1,0,18,0,0,0,0,0 which is type of object with properties 0,1,2,3,4,5,6,7,8,9,10
    // Final is 00010010

    // Check if the syn = ack = 1
    if (pkt.syn == 1 && pkt.ack == 1) {
      console.log("We have syn == 1 && pack == 1!");
      client.send(pkt.encode(), send_port, host, (err) => {});
    }
  });
};

class TCPPacket {
  constructor(
    src_port,
    dst_port,
    seq_num,
    ack_num,
    data_offset = 0,
    cwr = 0,
    ece = 0,
    urg = 0,
    ack = 0,
    psh = 0,
    rst = 0,
    syn = 0,
    fin = 0,
    window = 0,
    checksum = 0,
    urgent = 0,
    options = 0,
    data = 0
  ) {
    this.src_port = src_port;
    this.dst_port = dst_port;
    this.seq_num = seq_num;
    this.ack_num = ack_num;
    this.data_offset = data_offset;
    this.cwr = cwr;
    this.ece = ece;
    this.urg = urg;
    this.ack = ack;
    this.psh = psh;
    this.rst = rst;
    this.syn = syn;
    this.fin = fin;
    this.window = window;
    this.checksum = checksum;
    this.urgent = urgent;
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

  updateRecieveData(data) {
    this.seq_num = data[packetIndices.seq_num] + 1;
    this.ack_num = data[packetIndices.ack_num];
    this.data_offset = data[packetIndices.data_offset];
    this.flags(data[packetIndices.flags]);
    this.window = data[packetIndices.window];
    this.checksum = data[packetIndices.checksum];
    this.urgent = data[packetIndices.urgent];
    this.options = data[packetIndices.options];
    this.data = data[packetIndices.data];
  }

  flags(flagNum) {
    var flagBinary = flagNum.toString(2);
    var padLength = 8 - flagBinary.length;
    var flagsPadded = "0".repeat(padLength) + flagBinary;
    // console.log("Final is " + flagsPadded);

    this.ece = parseInt(flagsPadded[1]);
    this.urg = parseInt(flagsPadded[2]);
    this.ack = parseInt(flagsPadded[3]);
    this.psh = parseInt(flagsPadded[4]);
    this.rst = parseInt(flagsPadded[5]);
    this.syn = parseInt(flagsPadded[6]);
    this.fin = parseInt(flagsPadded[7]);

    // Update the flags
    // var flagObj = {
    //   cwr: parseInt(flagsPadded[0]),
    //   ece: parseInt(flagsPadded[1]),
    //   urg: parseInt(flagsPadded[2]),
    //   ack: parseInt(flagsPadded[3]),
    //   psh: parseInt(flagsPadded[4]),
    //   rst: parseInt(flagsPadded[5]),
    //   syn: parseInt(flagsPadded[6]),
    //   fin: parseInt(flagsPadded[7]),
    // }
  }
}
