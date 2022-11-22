# echo-client.py

import socket
import sys
import json

HOST = "127.0.0.1"  # The server's hostname or IP address
PORT = 65432  # The port used by the server

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    # TODO: instead of using .connect, intialize handshake.
    s.connect((HOST, PORT))
    s.sendall(b"Hello, world")
    data = s.recv(1024)

print(f"Received {data!r}")

# TODO: Send SYN to server to initiate TCP connection with the server


def send_syn():
    return

# TODO: Send ACK to server after receiving SYN_ACK from server


def send_ack():
    return
