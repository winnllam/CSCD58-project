import socket
from packet.packet import TCPPacket

HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
PORT = 65432  # Port to listen on (non-privileged ports are > 1023)

# TODO: Send SYN_ACK after receing SYN from client
def send_syn_ack():
    return

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
    s.bind((HOST, PORT))
    while True:
        # Listen on address
        data, addr = s.recvfrom(1024)
        print(data)
      


