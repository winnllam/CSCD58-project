import socket
from packet.packet import TCPPacket
from Crypto.Cipher import AES
from api.api import OpenParlimentApi, LIST_OF_TOPICS, URL, TOPICS, BILLS, VOTES, POLITICIANS, DEBATES, COMMITTEES
import struct

HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
PORT = 65432  # Port to listen on (non-privileged ports are > 1023)
PACKET_TYPE = "!HHIIBBHHHI"
DATA_LEN = 1656
CBC_IV = b'bKWDch24NmLyLLAx'
KEY = b'kHEmduHeKCCtsuWu'
DELIMITER = "|"


port_to_parliment = {}
port_to_d = {}

# Helper function to decode packet from byte to TCPPacket structure


def decode_packet(data):
    decoded_data = struct.unpack(PACKET_TYPE, data[:-DATA_LEN])
    flag_byte = bin(decoded_data[5])[2:].rjust(8, '0')
    received_packet = TCPPacket(src_port=decoded_data[0], dst_port=decoded_data[1], seq_num=int(decoded_data[2]), ack_num=decoded_data[3], cwr=flag_byte[0], ece=flag_byte[1], urg=flag_byte[2],
                                ack=flag_byte[3], psh=flag_byte[4], rst=flag_byte[5], syn=flag_byte[6], fin=flag_byte[7], checksum=decoded_data[6], options=decoded_data[7], data=data[-DATA_LEN:])
    return received_packet

# Helper function to decode packet from byte form, and return the flag byte string


def decode_packet_flag_byte(data):
    decoded_data = struct.unpack(PACKET_TYPE, data[:-DATA_LEN])
    flag_byte = bin(decoded_data[5])[2:].rjust(8, '0')
    return flag_byte


def send_syn_ack(s, client_host, client_port, seq_num):
    pkt = TCPPacket(src_port=PORT, dst_port=client_port,
                    seq_num=seq_num, ack_num=1, syn=1, ack=1)
    print(f"Server is sending SYN-ACK to client {(client_host, client_port)}")
    print(f"Data sent: {pkt.encode()}")
    s.sendto(pkt.encode(), (client_host, client_port))
    return


def send_fin_ack(s, client_host, client_port, seq_num):
    pkt = TCPPacket(src_port=PORT, dst_port=client_port,
                    seq_num=seq_num, ack_num=1, fin=1, ack=1)
    print(f"Server is sending FIN-ACK to client {(client_host, client_port)}")
    print(f"Data sent: {pkt.encode()}")
    s.sendto(pkt.encode(), (client_host, client_port))
    return


def send_response(s, client_host, client_port, seq_num, response_data):
    pkt = TCPPacket(src_port=PORT, dst_port=client_port,
                    seq_num=seq_num, data=response_data, ack_num=1)
    s.sendto(pkt.encode(), (client_host, client_port))


def call_api(packet_data, port):
    # parse the packet data to get the info we need
    # it is in the format of b'...' so we can take out the first two and last character
    # the packet is padded with ' ', so we can take all those out too
    # put the values into a list after splitting input by delimiter
    space_index = packet_data.find(" ")
    data = packet_data[2:space_index]
    data_list = data.split(DELIMITER)

    # build the string we are returning
    result = ""

    # if it is more than one number, then it is the first api call (topic + filters)
    # if it is just one number, then it is the second api call (page contents)
    if len(data_list) > 1:
        topic = LIST_OF_TOPICS[int(data_list[0]) - 1]
        filters = {}

        if int(data_list[1]) != 0:
            # filters so need to put them into a dictionary
            for i in range(1, len(data_list) - 1, 2):
                name_index = int(data_list[i]) - 1
                value = data_list[i+1]
                # in pairs of filter name, value
                filter_details = TOPICS[topic][name_index]
                filters[filter_details[0]] = value

        api = OpenParlimentApi(topic, filters)
        port_to_parliment[port] = api
        curr_api = port_to_parliment[port]
        if curr_api.get_data() != None:
            res = list(curr_api.get_data().values())
            result = create_list(res, port, api)
        else:
            result = "Invalid input was detected." + DELIMITER

    elif len(data_list) == 1:
        selected = int(data_list[0])
        # api = OpenParlimentApi('', {})
        curr_api = port_to_parliment[port]

        if selected == 0:
            # get previous
            prev = curr_api.get_prev()
            if prev != None:
                res = list(prev.values())
                result = create_list(res, port, curr_api)

        elif selected == 6:
            # get next
            next = curr_api.get_next()
            if next != None:
                res = list(next.values())
                result = create_list(res, port, curr_api)

        else:
            ds = port_to_d[port][selected - 1]
            print("DS IS", ds)
            res = curr_api.get_sub_data(ds)

            # parse based on the api topic
            if BILLS in ds:
                result = create_bills_output(res)
            elif VOTES in ds:
                result = create_votes_output(res)
            elif DEBATES in ds:
                result = create_debates_output(res)
            elif POLITICIANS in ds:
                result = create_politicians_output(res)
            elif COMMITTEES in ds:
                result = create_committees_output(res)
            # parse dictionary
            else:
                for key in res:
                    # dont take the url keys since we wont be going to them anyways
                    if URL not in key:
                        result += key + ": " + str(res[key]) + "<br>"

    if result == "":
        return "No results found." + DELIMITER
    return result


def create_list(res, port, api):
    port_to_d[port] = []
    result = "-1: Cancel <br>" + DELIMITER
    if (api.prev_url != None and api.prev_url != ""):
        result += "0: Previous 5 <br>" + DELIMITER

    for i in range(len(res)):
        result += str(i + 1) + ". " + res[i][URL] + "<br>" + DELIMITER
        port_to_d[port].append(res[i][URL])

    if (api.next_url != None and api.next_url != ""):
        result += "6. Next 5 <br>" + DELIMITER

    return result


def create_bills_output(res):
    result = ""

    for key in res:
        # not taking urls
        if URL not in key and key != "related" and key != "short_title":
            if key == "status" or key == "name":
                result += "<b>" + key + "</b>: " + res[key]["en"] + "<br>"
            else:
                result += "<b>" + key + "</b>: " + str(res[key]) + "<br>"

    return result


def create_votes_output(res):
    result = ""

    for key in res:
        # not taking urls
        if URL not in key and key != "related" and key != "context_statement":
            if key == "description":
                result += "<b>" + key + "</b>: " + res[key]["en"] + "<br>"
            elif key == "party_votes":
                result += "<b>" + key + "</b>: "
                for party in res[key]:
                    result += party["party"]["short_name"]["en"] + \
                        ": " + party["vote"] + ", "
            else:
                result += "<b>" + key + "</b>: " + str(res[key]) + "<br>"

    return result


def create_debates_output(res):
    result = ""

    for key in res:
        # not taking urls
        if URL not in key and key != "related":
            if key == "most_frequent_word":
                result += "<b>" + key + "</b>: " + res[key]["en"] + "<br>"
            else:
                result += "<b>" + key + "</b>: " + str(res[key]) + "<br>"

    return result


def create_politicians_output(res):
    result = ""

    for key in res:
        # not taking urls
        if URL not in key and key != "image":
            if key == "name":
                result += "<b>" + "Name" + "</b>: " + str(res[key]) + "<br>"
            elif key == "memberships":
                result += "<b>" + "Riding" + "</b>: " + \
                    res[key][0]["riding"]["name"]["en"] + "<br>"
                result += "<b>" + "Party" + "</b>: " + \
                    res[key][0]["party"]["short_name"]["en"] + "<br>"
    return result


def create_committees_output(res):
    result = ""

    for key in res:
        # not taking video urls
        if key == "name":
            result += "<b>" + "Name" + "</b>: " + str(res[key]["en"]) + "<br>"
            result += "<ol>"
        elif key == "sessions":
            for obj in res[key]:
                for item in obj:
                    if item == "session":
                        result += "<li>" + "Session" + ": " + \
                            str(obj[item]) + "</li>"
            result += "</ol>"

    return result


with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
    s.bind((HOST, PORT))
    # List of addresses (host, port) where the connection is established
    connections = []
    # List of addresses (host, port) where we are awaiting to receive ACK packet to confirm connection
    ack_waiting = []
    # List of address on passive close
    passive_close = []
    ack_timeouts = []
    while True:
        # When a packet is received it can be...
        # A: TCP handshake - start connection
        # receive SYN - Send SYN-ACK
        # receive ACK - Connection established
        # C: Data from established connection
        # B: TCP end connection (https://www.geeksforgeeks.org/tcp-connection-termination/)
        # Receive FIN
        # Receive ACK of FIN

        # Receive packet data and process it
        data, addr = s.recvfrom(2500)
        cipher = AES.new(KEY, AES.MODE_CBC, CBC_IV)
        decoded_data = cipher.decrypt(data)
        pkt = decode_packet(decoded_data)
        pkt_flag = decode_packet_flag_byte(decoded_data)
        # Case 1: SYN request
        if (pkt_flag == "00000010"):
            print(f"SYN request received from {addr}")
            print(f"Received data: {pkt.data}")
            # Syn request received, so send SYN-ACK
            send_syn_ack(s, addr[0], addr[1], pkt.seq_num+1)
            # Wait for ACK response
            ack_waiting.append(addr)
        # Case 2: ACK request
        elif (pkt_flag == "00010000" and addr in ack_waiting):
            print(f"Handshake ACK received from {addr}")
            print(f"Received data: {pkt.data}")
            # Establish connection, ready to receive
            ack_waiting.remove(addr)
            connections.append(addr)
        # Case 3: Received FIN request
        elif (pkt_flag == "00000001" and addr in connections):
            print(f"FIN request received from {addr}")
            print(f"Received data: {pkt.data}")
            print(f"Server passive close connection with {addr}.")
            # Send ACK to client for them to enter FIN_WAIT_2
            send_fin_ack(s, addr[0], addr[1], pkt.seq_num+1)
            # Send FIN for client to enter TIME_WAIT
            # Passive close connection
            passive_close.append(addr)
        # Case 4: Received FIN-ACK
        elif (pkt_flag == "00010001" and addr in passive_close):
            print(f"Second FIN request received from {addr}")
            print(f"Received data: {pkt.data}")
            print(f"Server closed connection with {addr}.")
            # Officially closeconnection
            passive_close.remove(addr)
            connections.remove(addr)
        # Case 5: Connection is already established
        elif (addr in connections):
            print(f"Received data from active connection, {addr}")
            print(f"Received data: {pkt.data}")
            response_data = call_api(str(pkt.data), addr[1])
            # Send packet back to client with necessary info
            send_response(s, addr[0], addr[1], pkt.seq_num+1, response_data)
