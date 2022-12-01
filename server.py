import socket
from packet.packet import TCPPacket

# CLIENT_HOST = "127.0.0.1"
# CLIENT_PORT = 65433

HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
PORT = 65432  # Port to listen on (non-privileged ports are > 1023)

# TODO: Send SYN_ACK after receing SYN from client


def send_syn_ack(s, client_host, client_port):
    pkt = TCPPacket(src_port=PORT, dst_port=client_port,
                    seq_num=2, ack_num=1, syn=1, ack=1)
    print("The server is sending the following packet:")
    print(pkt.encode())
    s.sendto(pkt.encode(), (client_host, client_port))
    return


def receive_syn(s):
    data, addr = s.recvfrom(1024)
    print(data)
    # TODO: process data, check if SYN flag is on, then return addr otherwise null
    return addr


def receive_tcp_connection(s):
    addr = receive_syn(s)
    if not addr:
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
