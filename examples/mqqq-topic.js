const util = require('util');
const Web3 = require('web3');
const ttt  = require('../index');

const MQTT_BROKER_TCP = 'tcp://35.166.170.137:1883';
const MQTT_BROKER_TLS = 'tls://35.166.170.137:8443';

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const carAddr = '0x47d20260d01093f26e0c863c992caa796d45c131';

web3.eth.getAccounts((err, accs) => {
    if (err) throw err;
    if (accs.length === 0) throw new Error('No account!');
    var sender = new ttt.MQTTT(accs[1], new ttt.signers.Web3Signer(web3, 'nohash', 'hashPersonal'), MQTT_BROKER_TCP);

    var requestObj = {
        service: 'carsharing',
        payload: {
            intent: 'request-car',
            content: {
                renterID: 'XXX',
                startDatetime: 'A',
                endDatetime: 'B'
            }
        } 
    }
    sender.listen(true, (err, msg) => {
        if (err) throw err;
        console.log(util.format('%s received "%s, signed: %s"', sender.getAddress(), msg.data, msg.signed));
        sender.stop();
    });

    setTimeout(() => {
        sender.send('/service/carsharing/NJ/Jersey City', JSON.stringify(requestObj), 'service');
    }, 3000);

});



