import struct

class TCPPacket:
    def __init__ (self, src_port, dst_port, seq_num, ack_num, ns=0, cwr=int(0), ece=int(0), urg=int(0), ack=int(0), psh=int(0), rst=int(0), syn=int(0), fin=int(0), checksum=0, options=0, data=0):
        self.src_port = src_port
        self.dst_port = dst_port
        self.seq_num = seq_num
        self.ack_num = ack_num
        # data offsetp
        # reserved 3 bits
        # THESE ARE FLAGS
        self.ns = ns
        self.cwr = cwr
        self.ece = ece
        self.urg = urg
        self.ack = ack
        self.psh = psh
        self.rst = rst
        self.syn = syn
        self.fin = fin
        # window --skip
        self.checksum = checksum
        # urgent pointer --skip
        self.options = options
        self.data = data

    # Build the data to byte object
    # https://docs.python.org/3.7/library/struct.html#format-characters
    # ! = network byte order (big-endian)
    # 4s = string of 2 bytes
    # H Source Port - 2 bytes (16 bits)  unsighed short, standard size 2
    # H Destination Port - 2 bytes character
    # I Sequence Number - 4 bytes integer (32 bits) unsighed int, standard size 4
    # I Acknowledgement Number - 4 bytes integer (32 bits)
    # B Data offset + Res
    # B Flags cwr-fin
    # H Window
    # H Checksum - INTIALIZE 0 
    # H Urgent Pointer
    # I Options + Padding
    # I Data TODO: can be more? 

    def encode (self):
        flags = str(self.cwr) + str(self.ece) + str(self.urg) + str(self.ack) + str(self.psh) + str(self.rst) + str(self.syn) + str(self.fin)
        return struct.pack("!HHIIBBHHHII", self.src_port, self.dst_port, self.seq_num, self.ack_num, 0, flags, 0, 0, 0, self.options, self.data)

    def decode (self):
        return struct.unpack("!HHIIBBHHHII", self)



