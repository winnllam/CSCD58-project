import socket
from packet.packet import TCPPacket
import struct

# CLIENT_HOST = "127.0.0.1"
# CLIENT_PORT = 65433

HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
PORT = 65432  # Port to listen on (non-privileged ports are > 1023)

# Helper function to decode packet from byte to TCPPacket structure


def decode_packet(data):
    decoded_data = struct.unpack("!HHIIBBHHHII", data)
    flag_byte = bin(decoded_data[5])[2:].rjust(8, '0')
    received_packet = TCPPacket(src_port=decoded_data[0], dst_port=decoded_data[1], seq_num=int(decoded_data[2])+1, ack_num=decoded_data[3], cwr=flag_byte[0], ece=flag_byte[1], urg=flag_byte[2], ack=flag_byte[3], psh=flag_byte[4], rst=flag_byte[5], syn=flag_byte[6], fin=flag_byte[7], checksum=decoded_data[6], options=decoded_data[7], data=decoded_data[8])
    return received_packet

# Helper fuynction to decode packet from byte form, and return the flag byte string


def decode_packet_flag_byte(data):
    decoded_data = struct.unpack("!HHIIBBHHHII", data)
    flag_byte = bin(decoded_data[5])[2:].rjust(8, '0')
    return flag_byte

# After receiving ack it will start connection


def receive_ack(s):
    data, addr = s.recvfrom(1024)
    if(decode_packet_flag_byte(data) == "00010000"):
        print("Yes. ACK packet received.")
        return addr
    return ()


def send_syn_ack(s, client_host, client_port):
    pkt = TCPPacket(src_port=PORT, dst_port=client_port, seq_num=2, ack_num=1, syn=1, ack=1)
    print("SYN-ACK: The server is sending the following packet:")
    print(pkt.encode())
    s.sendto(pkt.encode(), (client_host, client_port))
    return


def receive_syn(s):
    data, addr = s.recvfrom(1024)
    print("Server received the following packet")
    print(data)
    if(decode_packet_flag_byte(data) == "00000010"):
        print("Yes. SYN packet received.")
        return addr
    return ()


def receive_tcp_connection(s):
    addr = receive_syn(s)
    if not addr:
        print("Not a syn packet. Wait for another syn packet, restart TCP process")
        return
    send_syn_ack(s, addr[0], addr[1])
    addr = receive_ack(s)
    print("TCP Handshake complete. Established connection wtih")
    print(addr)
    # Return address, add to active connections
    return addr


with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
    s.bind((HOST, PORT))
    connections = []
    while True:
        connections.append(receive_tcp_connection(s))
        data, addr = s.recvfrom(1024)
