import socket
from packet.packet import TCPPacket

CLIENT_HOST = "127.0.0.1"
CLIENT_PORT = 65433

HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
PORT = 65432  # Port to listen on (non-privileged ports are > 1023)

# TODO: Send SYN_ACK after receing SYN from client


def send_syn_ack(s):
    pkt = TCPPacket(src_port=1234, dst_port=PORT, seq_num=1, ack_num=1)
    print("The server is sending the following packet:")
    print(pkt.encode())
    s.sendto(pkt.encode(), (CLIENT_HOST, CLIENT_PORT))
    return


with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
    s.bind((HOST, PORT))
    while True:
        # TODO: GET THE HOST/PORT OF CLIENT ON FIRST COMMUNICATION.
        # ASSUMING WE KNOW THEIR HOST AND PORT AT THIS POINT
        # FOR TESTING. CONSTANTLY SENDINGG TCP PACKET.
        send_syn_ack(s)
        # Listen on address
        data, addr = s.recvfrom(1024)
        print(data)
