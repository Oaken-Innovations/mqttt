# MQTT-Trusted

The trusted messaging framework based on web3 and MQTT.

## Usage

```javascript
const util = require('util');
const Web3 = require('web3');
const MQTTT = require('../index'); // require('mqttt');

const MQTT_BROKER_TCP = 'tcp://ip:port'; // Change to your broker IP and Port

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
web3.eth.getAccounts((err, accs) => {
    if (err) throw err;
    if (accs.length === 0) throw new Error('No account!');
    var client = new MQTTT(web3, accs[0], MQTT_BROKER_TCP);
    client.listen(true, (err, msg) => {
        if (err) throw err;
        console.log(util.format('%s received "%s"', client.getAddress(), msg.data));
        
    });

    //client.send(accs[1], 'Hello, world!', 'request');
});

```

Check `examples/` for more usages.

## License

Apache-2.0
