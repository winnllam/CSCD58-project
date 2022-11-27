import struct

class TCPPacket:
    def __init__ (self, src_port, dst_port, seq_num, ack_num, flags=0, checksum=0, options=0, data=0):
        self.src_port = src_port
        self.dst_port = dst_port
        self.seq_num = seq_num
        self.ack_num = ack_num
        # data offsetp
        # reserved
        self.flags = flags
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
    # H Flags  TODO: investigate the way data is packed for data offset, res, flags.
    # H Window
    # H Checksum - INTIALIZE 0 
    # H Urgent Pointer
    # I Options + Padding
    # I Data TODO: can be more? 

    def encode (self):
        return struct.pack("!HHIIBHHHHII", self.src_port, self.dst_port, self.seq_num, self.ack_num, 0, self.flags, 0, 0, 0, self.options, self.data)

    def decode (self):
        return struct.unpack("!HHIIBHHHHII", self)



