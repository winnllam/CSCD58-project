// Import Statements
var dgram = require("dgram");
const { Buffer } = require("node:buffer");
const struct = require("python-struct");
const internal = require("stream");

// Constant variables
const packetType = "!HHIIBBHHHI";
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

// API constant variables
const BILLS = "bills";
const VOTES = "votes";
const POLITICIANS = "politicians";
const DEBATES = "debates";
const COMMITTEES = "committees";
const DATA_LEN = 1000;

const LIST_OF_TOPICS = [BILLS, VOTES, POLITICIANS, DEBATES, COMMITTEES];

const TOPICS = {
  [BILLS]: [
    ["introduced", "Date bill was introduced in the format yyyy-mm-dd"],
    ["legisinfo_id", "ID assigned by parl.gc.ca's LEGISinfo"],
    ["private_member_bill", "Is it a private member's bill? True or False"],
    ["law", "Did it become law? True or False"],
    ["number", "ex. C-10"],
    ["session", "Session number, ex. 41-1"],
  ],
  [VOTES]: [
    ["bill", "ex. /bills/41-1/C-10/"],
    ["nay_total", "votes against"],
    ["yea_total", "votes for"],
    ["session", "ex. 41-1"],
    ["date", "ex. 2011-01-01"],
    ["number", "every vote in a session has a sequential number"],
    ["result", "Passed, Failed, Tie"],
  ],
  [POLITICIANS]: [
    ["family_name", "ex. Harper"],
    ["given_name", "ex. Stephen"],
    [
      "include",
      "'former' to show former MPs (since 94), 'all' for current and former",
    ],
    ["name", "ex. Stephen Harper"],
  ],
  [DEBATES]: [
    ["date", "ex. 2010-01-01"],
    ["number", "Each Hansard in a session is given a sequential #"],
    ["session", "ex. 41-1"],
  ],
  [COMMITTEES]: [["session", "??"]],
};

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
  console.log(pkt.encode());
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
    }

    window.location.href = "../components/chat.html";
  });
};

function scroll_to_bottom() {
  var elem = document.getElementById("chat");
  elem.scrollTop = elem.scrollHeight;
}

var chat_input = new Array();
var topic = "";
const valid_number_warning = "Please enter a valid number!";
const filter_value = "What value are you filtering for?";

function parse() {
  let text = document.getElementById("input").value;
  if (text != "") {
    print_as_user(text);
  }
  let input_length = chat_input.length;

  // check if the input is for the first question in the flow (which topic)
  // nothing so far has been selected
  if (input_length == 0) {
    // check if the input is a valid number
    if (isNaN(text) || text.length == 0) {
      print_as_bot(valid_number_warning);
      return;
    }

    // check if the input is a valid number in terms of range
    let input_num = parseInt(text);
    if (input_num < 0 || input_num > LIST_OF_TOPICS.length) {
      print_as_bot(valid_number_warning);
      return;
    } else {
      // save the input selection number
      chat_input.push(input_num);
      console.log(chat_input);

      // output the next selection menu
      topic = LIST_OF_TOPICS[input_num - 1];
      print_selection_menu(TOPICS[topic]);
      // leave since we still need the filter input before sending to server
      return;
    }
  }

  // check if input is for the second question in the flow (filters)
  // the topic has been selected
  if (input_length >= 1) {
    // odd means we have 1 topic and pairs of filters + value
    if (input_length % 2 == 1) {
      // they are selecting a filter option
      // check if the input is a valid number
      if (isNaN(text) || text.length == 0) {
        print_as_bot(valid_number_warning);
        return;
      }

      // check if the input is a valid number in terms of range
      let input_num = parseInt(text);
      if (input_num < 0 || input_num > TOPICS[topic].length) {
        print_as_bot(valid_number_warning);
        return;
      } else if (input_num == 0) {
        // TODO: no filter is applied, skip straight to sending the packet over

        // reset the list since api has been called
        chat_input = new Array();
        return;
      } else {
        // save the input selection number
        chat_input.push(input_num);
        console.log(chat_input);
        print_as_bot(filter_value);
      }
    } else {
      // they are giving a filter value
      // any text works so just store that
      chat_input.push(text);
      console.log(chat_input);

      // relaunch the menu for them to see and run it back
      print_selection_menu(TOPICS[topic]);
    }
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

// Print text into the user bubble
function print_as_user(text) {
  document.getElementById("chat").innerHTML +=
    '<div class="chat user-chat"><p>' + text + "</p></div>";
  scroll_to_bottom();
}

// Print text into a chat bot bubble
function print_as_bot(text) {
  document.getElementById("chat").innerHTML +=
    '<div class="chat bot-chat"><p>' + text + "</p></div>";
  scroll_to_bottom();
}

// Print selection menu based on a dictionary
function print_selection_menu(sub_topics) {
  let text = "Select a filter you would like to add: <br>";
  text += "0. No filters <br>";
  for (let i = 0; i < sub_topics.length; i++) {
    text +=
      (i + 1).toString() +
      ". <b>" +
      sub_topics[i][0] +
      "</b>: " +
      sub_topics[i][1] +
      "<br>";
  }
  print_as_bot(text);
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

    let flagDecimal = parseInt(flags, 2);

    let encoded_data = Buffer.from(
      this.data + " ".repeat(DATA_LEN - this.data.length),
      "utf-8"
    );

    var encoded = struct.pack(
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
      this.options
    );
    return Buffer.concat([encoded, encoded_data]);
  }

  decode(data) {
    // TODO: Fix decode now for the data
    let unpacked = struct.unpack(
      packetType,
      Buffer.from(data.slice(0, -DATA_LEN), "hex")
    );
    let recieved_data = decodeURIComponent(data.slice(-DATA_LEN));
    unpacked.push(recieved_data);
    console.log("DECODED IS");
    console.log(unpacked);
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

    this.ece = parseInt(flagsPadded[1]);
    this.urg = parseInt(flagsPadded[2]);
    this.ack = parseInt(flagsPadded[3]);
    this.psh = parseInt(flagsPadded[4]);
    this.rst = parseInt(flagsPadded[5]);
    this.syn = parseInt(flagsPadded[6]);
    this.fin = parseInt(flagsPadded[7]);
  }
}
