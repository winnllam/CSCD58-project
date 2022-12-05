// Import Statements
var dgram = require("dgram");
var aesjs = require("aes-js");
const { Buffer } = require("node:buffer");
const struct = require("python-struct");
const { ipcRenderer } = require("electron");

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
const DATA_LEN = 1656;
const CBC_IV = Buffer.from("bKWDch24NmLyLLAx");
const CTR_NONCE = Buffer.from("HwxhkJKr");
const KEY = Buffer.from("kHEmduHeKCCtsuWu");
const DELIMITER = "|";

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
  [COMMITTEES]: [["session", "Session number, ex. 41-1"]],
};

const TOPIC_MENU_INTRO =
  "<p>Here are the available topics to search about:</p>";
const TOPIC_MENU =
  "<p>0. Exit</p>" +
  "<p>1. Bills</p>" +
  "<p>2. Votes</p>" +
  "<p>3. Politicians</p>" +
  "<p>4. Debates</p>" +
  "<p>5. Committees</p>";

// Connection settings
const host = "127.0.0.1";

// Can set dynamic port when running file: set PORT=65432&&npm start
const send_port = 65432;
const listen_port =
  process.env.PORT == null ? 65433 : parseInt(process.env.PORT);
const num_options = 8;
var client = dgram.createSocket("udp4");
client.bind(listen_port, host);

window.startConnection = function () {
  console.log("Client port is " + listen_port);
  var pkt = new TCPPacket(listen_port, send_port, 1, 1);
  pkt.updateProp("syn", 1);
  console.log("Client is sending the following packet:");
  console.log(pkt);
  client.send(pkt.encode(), send_port, host, (err) => {});

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
var api_call = 1;
var data_list = new Array();
const valid_number_warning = "Please enter a valid number!";
const filter_value = "What value are you filtering for?";

window.parse = function () {
  var chatDataPacket = new TCPPacket(listen_port, send_port, current_seq, 1);

  let text = document.getElementById("input").value;
  if (text != "") {
    print_as_user(text);
    document.getElementById("input").value = "";
  }
  let input_length = chat_input.length;

  // collection for first round of api call
  if (api_call == 1) {
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
        //  Exit and end the connection
        if (input_num == 0) {
          chatDataPacket.updateProp("fin", 1);
          chatDataPacket.updateProp("cwr", 0);
          chatDataPacket.updateProp("ece", 0);
          chatDataPacket.updateProp("ack", 0);
          chatDataPacket.updateProp("psh", 0);
          chatDataPacket.updateProp("rst", 0);
          chatDataPacket.updateProp("syn", 0);

          console.log("Client sending finish to server");
          client.send(chatDataPacket.encode(), send_port, host, (err) => {});

          client.on("message", function (msg, info) {
            console.log(
              "Received %d bytes from %s:%d\n",
              msg.length,
              info.address,
              info.port
            );

            var data = chatDataPacket.decode(msg);

            // Update with new things:
            chatDataPacket.updateRecieveData(data);

            // Check if the syn = ack = 1
            if (chatDataPacket.fin == 1 && chatDataPacket.ack == 1) {
              chatDataPacket.updateProp("fin", 1);
              chatDataPacket.updateProp("cwr", 0);
              chatDataPacket.updateProp("ece", 0);
              chatDataPacket.updateProp("ack", 1);
              chatDataPacket.updateProp("psh", 0);
              chatDataPacket.updateProp("rst", 0);
              chatDataPacket.updateProp("syn", 0);

              client.send(
                chatDataPacket.encode(),
                send_port,
                host,
                (err) => {}
              );

              setTimeout(() => {
                client.close();
              }, 5000);

              const ipc = ipcRenderer;
              ipc.send("kapat");
            }
          });
        } else {
          // save the input selection number
          chat_input.push(input_num);
          console.log(chat_input);

          // output the next selection menu
          topic = LIST_OF_TOPICS[input_num - 1];
          print_selection_menu(TOPICS[topic]);
        }
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
        if (input_num < -1 || input_num > TOPICS[topic].length) {
          print_as_bot(valid_number_warning);
          return;
        } else if (input_num == -1) {
          // they want to exit back to the topic menu
          chat_input = new Array();
          print_as_bot(TOPIC_MENU_INTRO);
          print_as_bot(TOPIC_MENU);
        } else if (input_num == 0) {
          chat_input.push(input_num);
          send_and_recieve(chatDataPacket, chat_input);
          return;
        } else {
          // save the input selection number
          chat_input.push(input_num);
          console.log(chat_input);
          print_as_bot(filter_value);
          return;
        }
      } else {
        // they are giving a filter value
        // any text works so just store that
        if (text.length == 0) {
          return;
        }

        chat_input.push(text);
        console.log(chat_input);

        // relaunch the menu for them to see and run it back
        print_selection_menu(TOPICS[topic]);
        return;
      }
    }
    // collection for second round of api call
  } else if (api_call == 2) {
    // check if valid input
    if (isNaN(text) || text.length == 0) {
      print_as_bot(valid_number_warning);
      return;
    }

    // check if input is within range
    let input_num = parseInt(text);
    // if length of list is 8, then we know the prev and next are in it
    // if length of list is 7, check first one to see if 0
    // if so we know prev is there, if not the next is there
    if (data_list.length == 8) {
      if (input_num < -1 || input_num > 6) {
        print_as_bot(valid_number_warning);
        return;
      }
    } else if (data_list.length <= 7) {
      includes_prev = 0;
      includes_next = 0;
      // figure out which of prev or next is missing
      for (let i = 0; i < data_list.length; i++) {
        if (data_list[i].includes("Previous")) {
          includes_prev = 1;
          if (input_num < -1 || input_num > 6 || input_num == 6) {
            print_as_bot(valid_number_warning);
            return;
          }
          break;
        } else if (data_list[i].includes("Next")) {
          includes_next = 1;
          if (input_num < -1 || input_num > 6 || input_num == 0) {
            print_as_bot(valid_number_warning);
            return;
          }
          break;
        }
      }

      // -1 1 2 3 4 5 6
      // -1 0 1 2 3 4 5

      if (input_num != -1) {
        if (includes_prev == 0 && input_num == 0) {
          // no previous button
          print_as_bot(valid_number_warning);
          return;
        } else if (includes_next == 0 && input_num == 6 || input_num > data_list.length - 1) {
          // no next option
          print_as_bot(valid_number_warning);
          return;
        }
      }
      // neither previous or next
      // includes_prev == 0 && includes_next == 0 &&     || (input_num == 0 || input_num == 6)
      // if (input_num != -1 && input_num > data_list.length - 1) {
      //   if (((includes_prev == 0 && input_num == 0) || (includes_next == 0 && input_num == 6)) && input_num > data_list.length - 1) {
      //     print_as_bot(valid_number_warning);
      //     return;
      //   }
      // }
    }

    if (input_num == -1) {
      api_call = 1;
      chat_input = new Array();
      print_as_bot(TOPIC_MENU_INTRO);
      print_as_bot(TOPIC_MENU);
      return;
    } else {
      if (input_num == 0 || input_num == 6) {
        api_call = 1;
      }
      send_and_recieve(chatDataPacket, [input_num]);
      return;
    }
  }
};

function send_and_recieve(packet, data_args) {
  // Concatenate the arguments
  var chat_data_string = data_args.join(DELIMITER);
  packet.updateProp("data", chat_data_string);

  // Send the packet to the server

  client.send(packet.encode(), send_port, host, (err) => {});

  // Recieve data back
  client.on("message", function (msg, info) {
    console.log(
      "Received %d bytes from %s:%d\n",
      msg.length,
      info.address,
      info.port
    );

    let recieved_data = packet.decode(msg);

    // Update with new things:
    packet.updateRecieveData(recieved_data);
  });

  // Display message to user about delay
  print_as_bot("Getting information, one second please");
  print_as_bot("...", true);
  setTimeout(() => {
    parse_packet(packet);
  }, 5000);
}

function parse_packet(packet) {
  console.log(packet.data);
  packet_data = packet.data.toString();

  if (api_call == 1) {
    console.log("first api call");
    // clean up the data into a list
    space_index = packet_data.lastIndexOf(DELIMITER);
    data = packet_data.slice(0, space_index);
    data_list = data.split(DELIMITER);
    // output the list
    console.log(data_list);
    print_as_bot(data_list.join(""));
    api_call = 2;
  } else if (api_call == 2) {
    console.log("second api call");
    print_as_bot(packet_data);
    // still display selection list incase they want to continue to see more
    print_as_bot("Select another page?");
    print_as_bot(data_list.join(""));
  }

  // reset the list since api has been called
  chat_input = new Array();
}

// Print text into the user bubble
function print_as_user(text) {
  document.getElementById("chat").innerHTML +=
    '<div class="chat user-chat"><p>' + text + "</p></div>";
  scroll_to_bottom();
}

// Print text into a chat bot bubble
function print_as_bot(text, dot = false) {
  if (!dot) {
    document.getElementById("chat").innerHTML +=
      '<div class="chat bot-chat"><p>' + text + "</p></div>";
  } else {
    document.getElementById("chat").innerHTML +=
      '<div class="chat bot-chat"><span class="dot" id="dot-1"></span><span class="dot" id="dot-2"></span><span class="dot" id="dot-3"></span></span></div>';
  }
  scroll_to_bottom();
}

// Print selection menu based on a dictionary
function print_selection_menu(sub_topics) {
  let text = "Select a filter you would like to add: <br>";
  text += "-1. Cancel <br>";
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
    var unencrypted_decoded_data = Buffer.concat([encoded, encoded_data]);
    var cipher = new aesjs.ModeOfOperation.cbc(KEY, CBC_IV);
    return cipher.encrypt(unencrypted_decoded_data);
  }

  decode(data) {
    //Decrypt data
    var cipher = new aesjs.ModeOfOperation.cbc(KEY, CBC_IV);
    var decrypted_data = cipher.decrypt(data);

    let unpacked = struct.unpack(
      packetType,
      Buffer.from(decrypted_data.slice(0, -DATA_LEN), "hex")
    );

    let received_data = decodeURIComponent(
      aesjs.utils.utf8.fromBytes(decrypted_data).slice(-DATA_LEN)
    );
    unpacked.push(received_data);
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
