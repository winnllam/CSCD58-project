import socket
from packet.packet import TCPPacket
import struct

# CLIENT_HOST = "127.0.0.1"
# CLIENT_PORT = 65433

HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
PORT = 65432  # Port to listen on (non-privileged ports are > 1023)

# TODO: Send SYN_ACK after receing SYN from client


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

    decoded_data = struct.unpack("!HHIIBBHHHII", data)
    print("Server is decoding:")
    print(decoded_data)
    flag_byte = bin(decoded_data[5])[2:].rjust(8, '0')
    print("Decoded flag:")
    print(flag_byte)
    # Rebuilding packet (Not necessary in this case but needed in future)
    # Ignore decoded_data[4] -> data offset + NS
    received_packet = TCPPacket(src_port=decoded_data[0], dst_port=decoded_data[1], seq_num=int(decoded_data[2])+1, ack_num=decoded_data[3], cwr=flag_byte[0], ece=flag_byte[1], urg=flag_byte[2], ack=flag_byte[3], psh=flag_byte[4], rst=flag_byte[5], syn=flag_byte[6], fin=flag_byte[7], checksum=decoded_data[6], options=decoded_data[7], data=decoded_data[8])
    # Technically don't need to seperate each flag_byte and r and can check for all flags like this:
    if(flag_byte == "00000010"):
        print("Yes. SYN packet received.")
        return addr
    # Otherwise this is not syn packet, return empty
    return ()

def receive_tcp_connection(s):
    addr = receive_syn(s)
    if not addr:
        print("Not a syn packet. Wait for another syn packet.")
        return
    send_syn_ack(s, addr[0], addr[1])

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
    s.bind((HOST, PORT))
    while True:
        receive_tcp_connection(s)
        # TODO: GET THE HOST/PORT OF CLIENT ON FIRST COMMUNICATION.
        # ASSUMING WE KNOW THEIR HOST AND PORT AT THIS POINT
        # FOR TESTING. CONSTANTLY SENDINGG TCP PACKET.
        # Listen on address
        data, addr = s.recvfrom(1024)
