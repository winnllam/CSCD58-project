import socket
from packet.packet import TCPPacket
from Crypto.Cipher import AES
from api.api import OpenParlimentApi, LIST_OF_TOPICS, URL, TOPICS
import struct

HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
PORT = 65432  # Port to listen on (non-privileged ports are > 1023)
PACKET_TYPE = "!HHIIBBHHHI"
DATA_LEN = 1000
CTR_NONCE = b'HwxhkJKr'
KEY = b'kHEmduHeKCCtsuWu'DELIMITER = "|"

d = []
api = OpenParlimentApi("", {})

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
    print("SYN-ACK: The server is sending the following packet:")
    print(pkt.encode())
    s.sendto(pkt.encode(), (client_host, client_port))
    return


def send_fin_ack(s, client_host, client_port, seq_num):
    pkt = TCPPacket(src_port=PORT, dst_port=client_port,
                    seq_num=seq_num, ack_num=1, fin=1, ack=1)
    print("FIN-ACK: The server is sending the following packet:")
    print(pkt.encode())
    s.sendto(pkt.encode(), (client_host, client_port))
    return


def send_fin(s, client_host, client_port, seq_num):
    pkt = TCPPacket(src_port=PORT, dst_port=client_port,
                    seq_num=seq_num, ack_num=1, fin=1)
    print("FIN: The server is sending the following packet:")
    print(pkt.encode())
    s.sendto(pkt.encode(), (client_host, client_port))
    return


def send_response(s, client_host, client_port, seq_num, response_data):
    pkt = TCPPacket(src_port=PORT, dst_port=client_port,
                    seq_num=seq_num, data=response_data, ack_num=1)
    s.sendto(pkt.encode(), (client_host, client_port))


def call_api(packet_data):
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

        global api
        api = OpenParlimentApi(topic, filters)
        if api.get_data() != None:
            res = list(api.get_data().values())
            result = create_list(res)
        else:
            result = "Invalid input was detected." + DELIMITER

    elif len(data_list) == 1:
        selected = int(data_list[0])
        # api = OpenParlimentApi('', {})

        if selected == 0:
            # get previous
            prev = api.get_prev()
            if prev != None:
                res = list(prev.values())
                result = create_list(res)

        elif selected == 6:
            # get next
            next = api.get_next()
            if next != None:
                res = list(next.values())
                result = create_list(res)

        else:
            res = api.get_sub_data(d[selected - 1])

            # parse dictionary
            for key in res:
                # dont take the url keys since we wont be going to them anyways
                if URL not in key:
                    result += key + DELIMITER + str(res[key]) + DELIMITER

    if result == "":
        return "No results found." + DELIMITER
    return result


def create_list(res):
    global d
    d = []
    result = ''

    if (api.prev_url != None):
        result += "0: Previous 5 <br>" + DELIMITER

    for i in range(len(res)):
        result += str(i + 1) + ". " + res[i][URL] + "<br>" + DELIMITER
        d.append(res[i][URL])

    if (api.next_url != None):
        result += "6. Next 5 <br>" + DELIMITER

    return result


with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
    s.bind((HOST, PORT))
    # List of addresses (host, port) where the connection is established
    connections = []
    # List of addresses (host, port) where we are awaiting to receive ACK packet to confirm connection
    ack_waiting = []
    # List of address on passive close
    passive_close = []
    # TODO: low-prio, timeout time for ack_waiting.
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
        data, addr = s.recvfrom(1024)
        cipher = AES.new(KEY, AES.MODE_CTR, nonce=CTR_NONCE)
        decoded_data = cipher.decrypt(data)
        pkt = decode_packet(decoded_data)
        pkt_flag = decode_packet_flag_byte(decoded_data)

        # Case 1: SYN request
        if (pkt_flag == "00000010"):
            # Syn request received, so send SYN-ACK
            send_syn_ack(s, addr[0], addr[1], pkt.seq_num+1)
            # Wait for ACK response
            ack_waiting.append(addr)
            print("packet data")
            print(pkt.data)
        # Case 2: ACK request
        elif (pkt_flag == "00010000" and addr in ack_waiting):
            # Establish connection, ready to receive
            ack_waiting.remove(addr)
            connections.append(addr)
            print(connections)
        # Case 3: Received FIN request
        elif (pkt_flag == "00000001" and addr in connections):
            # Send ACK to client for them to enter FIN_WAIT_2
            send_fin_ack(s, addr[0], addr[1], pkt.seq_num+1)
            # Send FIN for client to enter TIME_WAIT
            send_fin(s, addr[0], addr[1], pkt.seq_num+1)
            # Passive close connection
            passive_close.append(addr)
        # Case 4: Received FIN-AKCK
        elif (pkt_flag == "00010001" and addr in passive_close):
            # Officially closeconnection
            passive_close.remove(addr)
            connections.remove(addr)
        # Case 5: Connection is already established
        elif (addr in connections):
            print("Data received:")
            print(pkt.data)
            response_data = call_api(str(pkt.data))
            # Send packet back to client with necessary info
            send_response(s, addr[0], addr[1], pkt.seq_num+1, response_data)
