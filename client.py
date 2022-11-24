import socket
from packet.packet import TCPPacket

HOST = "127.0.0.1"  # The server's hostname or IP address
PORT = 65432  # The port used by the server

# TODO: Send SYN to server to initiate TCP connection with the server
def send_syn():
    return

# TODO: Send ACK to server after receiving SYN_ACK from server
def send_ack():
    return

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
    # This is sending a message directly to host/port without TCP connection.
    s.sendto(b"Hello World", (HOST, PORT))
    data = s.recv(1024)

print(f"Received {data!r}")
