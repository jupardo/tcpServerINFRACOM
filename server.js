// Start Server configuration

const net = require('net');
const messages = require('./messages');
const fs = require('fs');
const crypto = require('crypto');

const algorithm = 'md5';
const bufferLength = 1024 * 1024;
const logFile = 'docs/serverLog.json';

let numberOfActiveConnections = 0;
let {
    NumberOfRequiredConnections,
    file
} = process.env;
let sockets = [];

console.log(process.env.NumberOfRequiredConnections);
console.log(process.env.file);


const server = net.createServer();

server.on('close', () => console.log('Connection Closed'));

server.on('connection', (socket) => {
    socket.write(`<SERVIDOR::>Hello! ${socket.remoteAddress}`);
    //socket.setEncoding('utf-8');

    socket.write(`<SERVIDOR::>${messages.default.serverWillAskForReadiness}`);
    /*socket.setTimeout(100000, () => {
        console.log(`connection with ${socket.remoteAddress} timed out`);
    });*/

    socket.on('close', (error) => {
        console.log(`Connection with ${socket.remoteAddress} terminated. Sent ${socket.bytesWritten}bytes\n
        Received ${socket.bytesRead}bytes`);
        sockets = sockets.filter((storedSocket) => socket.remoteAddress !== storedSocket.remoteAddress);
        if (error) {
            console.error(`Error terminating connection with ${socket.remoteAddress}`);
        }
    });

    socket.on('data', (data) => handleDataReceive(socket, data));

    socket.on('end', () => console.log('End of message'));

    socket.on('error', console.log);
    /*socket.on('timeout', () => {
        socket.write('Connection timed out');
        console.log(`Connection with ${socket.remoteAddress} timed out. Closing connection`);
        socket.destroy();
    });*/
});


server.on('error', console.error);

server.on('listening', () => console.log("Listening on port 3312"))

server.listen(3312);


// End server configuration

//Start handling data
async function handleDataReceive(socket, data) {
    if (data == messages.default.JMETER) {
        numberOfActiveConnections++;
        sockets.push(socket);
        if (NumberOfRequiredConnections == numberOfActiveConnections) {
            try {
                //let fileData = await fs.readFile(file);
                sockets.forEach(async (socketToSend) => {
                    let hash = crypto.createHash(algorithm);
                    let startTime = process.hrtime();
                    const readStream = fs.createReadStream(file, {
                        highWaterMark: 512 * 1024
                    });
                    socketToSend.write('<SERVIDOR::>Start of file');

                    //readStream.pipe(socketToSend, { end: false });
                    readStream.on('data', (chunk) => {
                        socketToSend.write(chunk);
                        hash.update(chunk);
                    }).on('close', async () => {
                        setTimeout(() => {
                            //socketToSend.write('<SERVIDOR::>EOF');
                            //socketToSend.write(`<SERVIDOR::>HashCode: ${hash.digest('hex')}`);
                            let endTime = process.hrtime();
                            let success = true;
                            fs.appendFileSync(logFile, '\n' +
                                JSON.stringify({
                                    'Time Spent': `${endTime[0] - startTime[0]}seconds`,
                                    'Client IP': `${socketToSend.remoteAddress}`,
                                    'Bytes written': `${socketToSend.bytesWritten}`,
                                    'Bytes Read': `${socketToSend.bytesRead}`,
                                    'File': file,
                                    'Time': Date().toString(),
                                    'Success': success
                                }, null, 2), {
                                    'flags': 'a-'
                                });
                            socketToSend.end();
                        }, 5000);
                    });

                });
            } catch (error) {
                socket.write('<SERVIDOR::>Oops');
                console.error(error)
            }

        }
    }
    if (data == messages.default.clientIsReadyForData) {
        numberOfActiveConnections++;
        sockets.push(socket);
        if (NumberOfRequiredConnections <= numberOfActiveConnections) {
            try {
                //let fileData = await fs.readFile(file);
                sockets.forEach(async (socketToSend) => {
                    let hash = crypto.createHash(algorithm);
                    let startTime = process.hrtime();
                    const readStream = fs.createReadStream(file, {
                        highWaterMark: 512 * 1024
                    });
                    socketToSend.write('<SERVIDOR::>Start of file');

                    //readStream.pipe(socketToSend, { end: false });
                    readStream.on('data', (chunk) => {
                        socketToSend.write(chunk);
                        hash.update(chunk);
                    }).on('close', async () => {
                        setTimeout(() => {
                            socketToSend.write('<SERVIDOR::>EOF');
                            socketToSend.write(`<SERVIDOR::>HashCode: ${hash.digest('hex')}`);
                        }, 5000);
                        socketToSend.on('data', (confirm) => {
                            let endTime = process.hrtime();
                            console.log(confirm.toString());
                            let success = confirm.toString().includes('OK');
                            fs.appendFileSync(logFile, '\n' +
                                JSON.stringify({
                                    'Time Spent': `${endTime[0] - startTime[0]}seconds`,
                                    'Client IP': `${socketToSend.remoteAddress}`,
                                    'Bytes written': `${socketToSend.bytesWritten}`,
                                    'Bytes Read': `${socketToSend.bytesRead}`,
                                    'File': file,
                                    'Time': Date().toString(),
                                    'Success': success
                                }, null, 2), {
                                    'flags': 'a-'
                                });
                            socketToSend.end();
                        });
                    });

                });
            } catch (error) {
                socket.write('<SERVIDOR::>Oops');
                console.error(error)
            }

        }
    } else if (data.includes(messages.default.clientHasReceivedData)) {
        //socket.write(`<SERVIDOR::>${socket.digest}`);
        console.log(socket.digest);
    }
    //let message = 
}