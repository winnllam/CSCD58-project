import struct
PACKET_TYPE = "!HHIIBBHHHI300p"


class TCPPacket:
    def __init__(self, src_port, dst_port, seq_num, ack_num, cwr=int(0), ece=int(0), urg=int(0), ack=int(0), psh=int(0), rst=int(0), syn=int(0), fin=int(0), checksum=0, options=0, data=""):
        self.src_port = src_port
        self.dst_port = dst_port
        self.seq_num = seq_num
        self.ack_num = ack_num
        # data offset + ns
        self.cwr = cwr
        self.ece = ece
        self.urg = urg
        self.ack = ack
        self.psh = psh
        self.rst = rst
        self.syn = syn
        self.fin = fin
        # window
        self.checksum = checksum
        # urgent pointer
        self.options = options
        self.data = data

    # Build the data to byte object
    # https://docs.python.org/3.7/library/struct.html#format-characters ex. 4s = string of 2 bytes

    # Pack Structure Overview:
    # ! = network byte order (big-endian)
    # H Source Port - 2 bytes unsighed short
    # H Destination Port - 2 bytes unsighed short
    # I Sequence Number - 4 bytes unsighed int
    # I Acknowledgement Number - 4 bytes unsighed int
    # B Data offset & Res & NS - 1 byte unsigned char *UNUSED*
    # B Flags CWR to FIN - 1 byte unsigned char
    # H Window - 2 bytes unsighed short *UNUSED*
    # H Checksum - 2 bytes unsighed short *INIT TO ZERO* TODO: make proper checksum
    # H Urgent Pointer - 2 bytes unsighed short *UNUSED*
    # I Options + Padding - 4 bytes unsighed int
    # I Data - 4 bytes unsighed int TODO: allocate more space, maybe type should be s (char)

    # TODO: we may want to lower sized of *UNUSED* since it's irrelevant to our implementation.
    # Focus is in TCP handshake and encryption, not other optimization methods.

    def encode(self):
        # Converts the flags directly to a byte string. 0 is no flag, 1 represents flag active
        flags = str(self.cwr) + str(self.ece) + str(self.urg) + str(self.ack) + \
            str(self.psh) + str(self.rst) + str(self.syn) + str(self.fin)
        return struct.pack(PACKET_TYPE, self.src_port, self.dst_port, self.seq_num, self.ack_num, 0, int(flags.encode(), base=2), 0, 0, 0, self.options, self.data)
