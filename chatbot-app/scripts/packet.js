export class TCPPacket {
    constructor(src_port, dst_port, seq_num, ack_num, flags=0, checksum=0, options=0, data=0) {
        this.src_port = src_port;
        this.dst_port = dst_port;
        this.seq_num = seq_num;
        this.ack_num = ack_num;
        this.flags = flags;
        this.checksum = checksum;
        this.options = options;
        this.data = data;
    }

    encode() {
        return struct.pack("!HHIIBHHHHII", this.src_port, this.dst_port, this.seq_num, this.ack_num, 0, this.flags, 0, 0, 0, this.options, this.data);
    }
    
    decode() {
        
    }
}