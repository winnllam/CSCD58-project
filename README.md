# CSCD58 Final Project

Fall 2022 Project

Link to Video Presentation: [OneDrive Link (Sign-In Required)](https://utoronto-my.sharepoint.com/:v:/g/personal/jtony_cao_mail_utoronto_ca/EXIOmz8IUqdDk0KYvRSeI8UBAFTWQ79CIDsMmTBcBHJgxg?e=rgwAwJ)

> Original MP4 video included as well

# Table of Contents

1. [Team Members](#team-members)
2. [Description of Project](#description-of-project)
3. [Explanation of Project Goals](#explanation-of-project-goals)
4. [Contributions of Each Team Member](#contributions-of-each-team-member)
5. [Running the Bot and Testing](#running-the-bot-and-testing)
   1. [Installing Required Dependencies](#installing-required-dependencies)
   2. [Launching the Application](#launching-the-application)
   3. [Testing the Project](#testing-the-project)
6. [Implementation Details](#implementation-details)
   1. [Multiple Clients](#multiple-clients)
   2. [Encryption](#encryption)
   3. [Server Features](#server-features)
   4. [Frontend App](#frontend-app)
7. [Project Analysis](#project-analysis)
   1. [Reflection on Result](#reflection-on-result)
   2. [Reflection on Implementation](#reflection-on-implementation)
8. [Concluding Remarks](#concluding-remarks)
   1. [Lessons Leanred](#lessons-learned)

## Team Members

1. Jin Rong Cao, Student Number: 1005043123
2. Michelle Kee, Student Number: 1005254038
3. Winnie Lam, Student Number: 1004971792

## Description of Project

The bot via the Open Parliment API provides Federal political information for Canada. Ther are currently five supported topics:

1. **Bills**: Status of bills within Canadian history including both government and private member bills
2. **Votes**: Votes of bills within Canadian history with details such as number of 'YEA' vs 'NAY' and if the bill was passed or defeated
3. **Politicians**: List of current Canadian MPs along with the riding and party they represent
4. **Debates**: Debates held within the House of Commons and their topics
5. **Committees** : List of committees and in which sessions were they active

## Explanation of Project Goals

Some goals and targets of the project that we had were:

1.  Allowing the client to connect to the chatbot server with a further target of allowing multiple concurrent users to access the chatbot.
2.  Allowing users to ask questions related to federal politics that is provided via the OpenParliment API; since this is not a web programming course we will focus less on how to get information and instead rely on current open source APIs that will serve our purpose.
3.  Encryption of dataa being sent between server and clients
4.  Implementation of the TCP protocol complete with the handshake, end of connection, etc...

## Contributions of Each Team Member

**Jin Rong Cao**

Contributions included:

- Setup of the ElectronJS project
- Setup of the client-server connections on the client side (TCP Handshake) including handling the sending of the data to the server and listening for a response
- Setup of the closing client connection
- Process of encoding and decoding packets to and from the server
- Using packets to send data from the user to the server
- Processing data returned from the server and using it within the front-end chat bot
- Various debugging issues (issue with concurrency, decryption errors, etc…)
- Front-end app mockup designs
- Joint collaborative efforts to fix display outputs into prettier
- Typing up the final report

**Michelle Kee**

Contributions included:

- Setup of the client-server connections on the server side (TCP Handshake, Fin, etc..)
- Handling of various packets sent from client (such as syn vs fin vs ack vs just an API call)
- Setup of the server closing client connection
- Enable the server to handle multiple client connections concurrently
- Encryption and decryption in client and server
- Setup of packet data structure and sizes

**Winnie Lam**

Contributions included:

- HTML & CSS Webpages of the application
- API calls to OpenParlimentAPI and parsing of output
- Parsing data packets to and from client and server to display to users
- Demo of the application in final video
- Joint collaborative efforts to fix display outputs into prettier

## Running the Bot and Testing

The bot runs via Python 3.9.13, npm 6.14.11 and electron v22.0.0 for this project that need to be pre-installed before running the application

- Python: https://www.python.org/downloads/
- Npm: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- Electrion: `npm install --save-dev electron` (https://www.electronjs.org/docs/latest/tutorial/quick-start)

### Installing Required Dependencies

```
pip3 install pycryptodome # Note: make sure `crypto` and `pycrypto` are not installed
pip3 install requests
npm install aes-js
npm install
```

### Launching the Application

> IMPORTANT: Server **MUST** be running before any client instances are launched

**Server**

To run the server, run `python3 server.py` from the `CSCD58-project` directory.

```
cd CSCD58-project && python3 server.py
```

**Client**

_Running a Single Client_
To run just a single client within the `CSCD58-project` directory perform the following

```
cd chatbot-app && npm start
```

_Running Multiple Clients_

> For each client launched, there needs to be a specificed port number per client.  
> To set a port number on Windows, run `set PORT=1234&&npm start` from the `chatbot-app` directory.  
> For MacOS/OS X/Linux, run `export PORT=1234&&npm start`.  
>  **NOTE:** M1 chips are not recommended/supported for multi-client

```
cd CSCD58-project/chatbot-app

# Windows
set PORT=1234&&npm start

# MacOS/OS X/Linux
export PORT=1234&&npm start
```

Note that multiple instances of the client can be run, as long as the PORT number is changed to an unused number (0-65432, 65434-65536). The default port number is 65432.

### Testing the Project

When the client is run, hitting start on the chatbot-app home page will start a connection with the server which can be seen in the server logs, and the logs on the client side. A 3-way TCP handshake is started with the server in order to establish the connection. Next, the chatbot-app will prompt some questions such as choosing 1 of the 5 currently supported topics where the user can choose their desired inquiry. With the user input, the client will send another packet to the server with the data, which can also be seen in the logs.

The server then processes the data and makes necessary api calls to obtain the data and sends the data back to the client in multiple packets. The response can then be seen on the chatbot-app and the client can continue to put in more inquiries. In addition, the client can stop the chat by selecting -1 and being brought back to the main menu where they can enter 0 to exit. At this time, the client will follow the TCP connection termination process and end connection with the server and the Electron app instance will shut down.

## Implementation Details

We followed the actual TCP packet structure closely and have created our own data structure to represent it. This can be found in `packet.py` and `packet.js`, which are identical representations of the data structure. All communication between the server and client is done through packets with this packet structure.

For the TCP handshake protocol, the client would send a TCP SYN packet to the server. The server would receive it and return a SYN-ACK packet to the client. The client would receive this and respond with an ACK packet. When the server receives this, the TCP handshake is complete and a connection is established between the server and the client.

For the TCP termination, the client would be the initiator of the FIN protocol as the server would be always running. The client will send a FIN packet to the server, and the server will respond with FIN and ACK to the client and put the connection with the client in a passive close state. When the client receives this, it will respond with a final ACK request and close its side of the connection and the chat page. When the server receives that final ACK request, it will properly close the connection with the client.

### Multiple Clients

The server can handle multiple clients and TCP handshakes + terminations concurrently as it uses lists to keep track of hosts in different stages while checking the packet flags.

Furthermore, there is a particular server instance per client that is differentiated based on the client port number to avoid any issues with having multiple clients perform API calls concurrently. For example, one client can be inquiring about Politicans while another inquires about Bills and the server will be able to return the correct response to each.

### Encryption

The encryption method that is used for each packet is AES cipher in CBC mode. It uses a secret IV that is already stored on the server and client side. In CBC mode, the IV vector will be repeated and expanded to the same size as the block that is encrypted. The IV goes through the XOR operation with the plaintext, and this encrypted text is then used as the IV key and to repeat the same process.

Attached is a diagram illustrating this process.

![Cipher Block Chaining Encryption](cbc_encryption.jpg)

[Credits from Medium](https://isuruka.medium.com/selecting-the-best-aes-block-cipher-mode-aes-gcm-vs-aes-cbc-ee3ebae173c#:~:text=This%20symmetric%2Freversible%20key%20encryption,key%20encryption%20cipher%20yet%20invented)

The block cipher encryption has a fixed block size of 16 bytes, meaning that the encrypted message must be padded to a multiple of 16 bytes for the algorithm to run. Because of this, the DATA_LEN of the data portion of the packet has been adjusted to also pad the unencrypted packet to fit this condition. This encryption and decryption method is used on the server and client side when transferring the packets. Therefore, even if the packets have been obtained and observed through packet sniffing by a third party, they would not be able to see the information as the packets are encrypted. Additionally, they would not be able to decrypt these packets without knowing the value of the secret IV that was used by the client/server.

### Server Features

The server acontains the backend logic for hitting the Open Parliment API we use to fuel the chatbot answers. We would call on the server to hit the required endpoints based on the user input on the client side, and return a nicely-formatted output back to the client for the user to either select from or read.

### Frontend App

The frontend of the application contains two HTML page, the home/introductory page and the chat page. The “start” button on the home page starts a connection with the server before sending them over to the chat to start chatting with the bot. The connection to the server enables the client and user to communicate with the Open Parliment API securely.

## Project Analysis

### Reflection on Result

Being able to develop a chatbot from scratch within a month is not an easy accomplishment in particular when balancing other course work, TA work and other business. With that being said, we as a team can look back and be proud on our end result as during the course of development, there were times when we thought certain features would not be possible nor would there be enough hours left to finish everything we desired to in our final result.

In particular, our final result is something we feel encapsulates the amount of time, research and dedication (given the constraints of reality) that was put in by each team member to implement not only a regular chat bot but one that incorporates fundamental computer network ideas and techniques. We found this project refreshing from our other Computer Science courses that places greater emphasis on theortical while this project has a balance between theortical aspects of Computer Networks and practial aspects of Computer Networks.

### Reflection on Implementation

It is hard to say our project is "perfect" as with many other things there is always room for improvement given the time, energy and dedication. There are some areas of improvement for our application such as:

- A better designed front-end that accepted not just numerical options from the client
- A better encryption algorithm such as Diffie-Hellman to securely send keys between client and server
- More functionalities or topics that could be searched or analyzed by the bot by combining different topics
- Improved code architecture to follow the SOLID design principles

## Concluding Remarks

This project provided us with great exposures into not only the basics of computer network but also how to build secure web applications between client and servers. It also gave us a practical in-depth look at the TCP Protocol and how it may be implemented for a web based application.

### Lessons Learned

As with any project, starting early is the key especially considering that November tends to be the busiest months for students with midterm and assignments occuring. Starting earlier allowed our team ample time to carefully think about our implementation and to debug errors as a group.

In particular with any group project, communication as a team is essential. Having flow charts to map out what each person needs helped in making sure that everyone was aware of the tasks they were doing.

This was especially important when there were times when the team would be mis-aligned on what the client and server needs to do especially as they are in different languages/frameworks.

A last lesson is that things always seem to take longer than expected. It was very important to prioritize tasks and try to get one thing up and running before trying to accomplish more. For example, getting the TCP handshake between the client and server working was one of our key priorities and took a lot longer than expected especially in the client side due to the unfamiliarity with network coding in JavaScript.
