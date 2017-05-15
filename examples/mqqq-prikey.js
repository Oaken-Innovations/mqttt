const util = require('util');

const ttt = require('../index');
const hdconfig = require('./hdconfig.json');

const MQTT_BROKER_TCP = 'tcp://35.166.170.137:1883';
const PrivKeySigner = ttt.signers.PrivKeySigner;

var senderAcc = ttt.deriveHDAccount(hdconfig['mnemonic'], hdconfig['rpcserver'], 0);
console.log('Sender account: ' + JSON.stringify(senderAcc));
var receiverAcc = ttt.deriveHDAccount(hdconfig['mnemonic'], hdconfig['rpcserver'], 1);
console.log('Receiver account: ' + JSON.stringify(receiverAcc));

var sender = new ttt.MQTTT(senderAcc.account, new PrivKeySigner(senderAcc.privkey, false),  MQTT_BROKER_TCP);
var receiver = new ttt.MQTTT(receiverAcc.account, new ttt.signers.PrivKeySigner(receiverAcc.privkey, false), MQTT_BROKER_TCP);
const requestMsg = "What's up";
const responseMsg = "Very good, thank you!";

receiver.listen(true, (err, msg) => {
    if (err) throw err;
    console.log(util.format('%s received "%s"', receiver.getAddress(), msg.data));
    receiver.send(sender.getAddress(), responseMsg, 'response');
    console.log(util.format('%s replied "%s"', receiver.getAddress(), responseMsg));
});
sender.listen(true, (err, msg) => {
    if (err) throw err;
    console.log(util.format('%s received "%s"', sender.getAddress(), msg.data));
    receiver.stop();
    sender.stop();
});

setTimeout(() => {
    sender.send(receiver.getAddress(), requestMsg, 'request');
    console.log(util.format('%s sent "%s"', sender.getAddress(), requestMsg));
}, 3000);


