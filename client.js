const net = require('net');
const messages = require('./messages');
const readline = require('readline');
const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'md5';
const port = 3312;
const address = 'localhost';
const file = './docs/clientLog.json';

let data = [];

let end = false;
let startTime;
let endTime;

let hash = crypto.createHash(algorithm);
//A simple socket tester
const modes = {
    waiting: 0,
    receivingFile: 1
}


let mode = modes.waiting;

let connection = net.connect({
    host: address,
    port: port
});

connection.on('data', (data) => {
    //console.log(data.toString());
    if (data.toString().includes('<SERVIDOR::>')) {
        console.log(data.toString().replace('<SERVIDOR::>', ''));
        if (data.toString().includes('Start of file')) {
            startTime = process.hrtime();
            mode = modes.receivingFile;
        }
        if (data.toString().includes('EOF')) {
            console.log('Found EOF');
            mode = modes.waiting;
            endTime = process.hrtime();
            //console.log(hash.digest('hex'));

        }
        if (data.toString().includes('HashCode')) {
            console.log(data.toString());
            let hashCode = data.toString().split(':')[3];
            if (hashCode.trim() === hash.digest('hex')) {
                end = true;
                connection.write('OK');
            } else {
                connection.write('ERROR');
            }
        }
    } else {
        //console.log('buff + ');

        //console.log(data);
        if (mode === modes.receivingFile) {
            hash.update(data);
        }
    }
});

connection.on('close', () => {
    if(end)
        console.log("Finished succesfully");
    fs.appendFileSync(file, '\n' + JSON.stringify({
        'Time Spent': `${end ? (endTime[0] - startTime[0]) : NaN}seconds`,
        'Bytes written': `${connection.bytesWritten}`,
        'Bytes Read': `${connection.bytesRead}`,
        'Time': Date().toString(),
        'Success': end
    }, null, 2), {
        'flags': 'a-'
    });
    if(!end)
        throw Error('Connection closed unexpectedly');
    process.exit(0);
});

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', function (line) {
    connection.write(line);
});