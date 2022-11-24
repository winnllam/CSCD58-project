import socket
from packet.packet import TCPPacket

HOST = "127.0.0.1"  # The server's hostname or IP address
PORT = 65432  # The port used by the server

# TODO: Send SYN to server to initiate TCP connection with the server
def send_syn():
    pkt = TCPPacket(src_port = 1234, dst_port = PORT, seq_num = 1, ack_num = 1)
    print(pkt.encode())
    print (pkt.encode().decode())
    return

# TODO: Send ACK to server after receiving SYN_ACK from server
def send_ack():
    return

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
    send_syn()
    # This is sending a message directly to host/port without TCP connection.
    s.sendto(b"Hello World", (HOST, PORT))
    data = s.recv(1024)
    s.close()
