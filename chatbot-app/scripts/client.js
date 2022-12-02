// Import Statements
var dgram = require("dgram");
const { Buffer } = require("node:buffer");
const struct = require("python-struct");
const internal = require("stream");

// Constant variables
const packetType = "!HHIIBBHHHI300p";
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
var current_seq = 0;

// Connection settings
const host = "127.0.0.1";
const send_port = 65432;
const listen_port = 65433;
const num_options = 8;
var client = dgram.createSocket("udp4");

window.startConnection = function () {
  client.bind(listen_port, host);

  var pkt = new TCPPacket(listen_port, send_port, 1, 1);
  pkt.updateProp("syn", 1);
  console.log("Client is sending the following packet:");
  console.log(pkt);
  client.send(pkt.encode(), send_port, host, (err) => {});
  console.log("Info sent");

  client.on("message", function (msg, info) {
    console.log(
      "Received %d bytes from %s:%d\n",
      msg.length,
      info.address,
      info.port
    );

    var data = pkt.decode(msg);

    // Update with new things:
    pkt.updateRecieveData(data);

    // Check if the syn = ack = 1
    if (pkt.syn == 1 && pkt.ack == 1) {
      console.log("We have syn == 1 && pack == 1!");
      console.log(pkt);
      pkt.updateProp("syn", 0);
      client.send(pkt.encode(), send_port, host, (err) => {});

      // Update the sequence number as the server does not reply
      current_seq = current_seq + 1;

      window.location.href = "../components/chat.html";
    }
  });
};

var chat_input = new Array();
const valid_number_warning =
  '<div class="chat bot-chat"><p>Please enter a valid number!</p></div>';

function parse() {
  var text = document.getElementById("input").value;
  // check if the input is a valid number
  if (isNaN(text)) {
    print_as_bot(valid_number_warning);
  }

  // check if the input is for the first question in the flow (which topic)
  if (chat_input.length == 0) {
    // check if the input is a valid number in terms of range
    var input_num = parseInt(text);
    // TODO: change to constant list length value
    if (input_num < 0 || input_num > 5) {
      print_as_bot(valid_number_warning);
    } else {
      // save the input selection
      chat_input.push(input_num);
      console.log(chat_input);

      // output the next selection menu
      // TODO: it should be based on the constant list again
    }
  }

  // check if input is for the second question in the flow (filters)
  if (chat_input.length == 1) {
  }

  // Send this data to the server
  // TODO: Fix with the real array afterwards
  var chat_input_dummy = new Array();
  for (let i = 0; i < 1 + num_options; i++) {
    if (i == 0) {
      chat_input_dummy.push("0");
    } else {
      chat_input_dummy.push("");
    }
  }
  var chat_data_string = chat_input_dummy.join("|");

  // TODO: Determine is ack_num always 1?
  var chatDataPacket = new TCPPacket(listen_port, send_port, current_seq, 1);
  chatDataPacket.updateProp("data", chat_data_string);

  console.log("Client is sending the following DATA packet:");
  console.log(chatDataPacket);
  client.send(chatDataPacket.encode(), send_port, host, (err) => {});
  console.log("DATA Info sent");
}

function print_as_bot(html) {
  document.getElementById("chat").innerHTML += html;
}

// TCP Packet
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
    data = ""
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
      packetType,
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
    current_seq = this.seq_num;
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

    this.ece = parseInt(flagsPadded[1]);
    this.urg = parseInt(flagsPadded[2]);
    this.ack = parseInt(flagsPadded[3]);
    this.psh = parseInt(flagsPadded[4]);
    this.rst = parseInt(flagsPadded[5]);
    this.syn = parseInt(flagsPadded[6]);
    this.fin = parseInt(flagsPadded[7]);
  }
}
