const util = require('util');
const Web3 = require('web3');
const ttt  = require('../index');

const MQTT_BROKER_TCP = 'tcp://35.166.170.137:1883';

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
web3.eth.getAccounts((err, accs) => {
    if (err) throw err;
    if (accs.length === 0) throw new Error('No account!');
    var receiver = new ttt.MQTTT(accs[0], new ttt.signers.Web3Signer(web3, 'nohash', 'hashPersonal'),  MQTT_BROKER_TCP);
    var sender = new ttt.MQTTT(accs[1], new ttt.signers.Web3Signer(web3, 'nohash', 'hashPersonal'), MQTT_BROKER_TCP);
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
        console.log(util.format('%s received "%s, signed: %s"', sender.getAddress(), msg.data, msg.signed));
        receiver.stop();
        sender.stop();
    });

    setTimeout(() => {
        sender.send(receiver.getAddress(), requestMsg, 'request');
        console.log(util.format('%s sent "%s"', sender.getAddress(), requestMsg));
    }, 3000);

});



