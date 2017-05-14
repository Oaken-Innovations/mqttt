const ethjsUtil = require('ethereumjs-util');
const mqtt = require('mqtt');
const util = require('util');

const DEFAULT_TTV = 1000*60;

/**
 * Generate MQTTT peer addrss based on the crypto address of the node.
 */
function mqtttPeerAddress(addr) {
    return util.format('/mqttt/%s', addr);
}

/**
 * MQTT-Trusted stateless messaging.
 * @construct
 */
function MQTTT(web3, account, broker, ttv) {
    var self = this;
    self.web3 = web3;
    self.account = account;
    self.mqttClient = mqtt.connect(broker);
    self.ttv = (typeof ttv === 'undefined') ? DEFAULT_TTV : ttv;
}

/**
 * Listen to peer messages.
 * @param {Boolean} checkDate Whether to check message date.
 * @callback The callback function with (err, msgobj) as params.
 */
MQTTT.prototype.listen = function (checkDate, callback) {
    var self = this;
    self.mqttClient.on('connect', () => {
        var topic = mqtttPeerAddress(self.account);
        self.mqttClient.subscribe(topic);
        console.log(util.format('Node subscribed to %s', topic));
    });

    self.mqttClient.on('message', (topic, msg) => {
        // -$- Checking for trusted message and peel off the addendum -$-
        var msg = msg.toString().trim(); 
        var msgobj = JSON.parse(msg);
        if (msgobj.to.toLowerCase().toLowerCase() !== self.account.toLowerCase()) {
            return callback(new Error('Message not to me!'));
        }
        var sig = msgobj.signature;
        delete msgobj['signature'];
        var sigParams = ethjsUtil.fromRpcSig(sig); 
        var msgHash = ethjsUtil.sha3(JSON.stringify(msgobj));
        var pubkey = ethjsUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s);
        var addr = ethjsUtil.pubToAddress(pubkey);
        addr = ethjsUtil.addHexPrefix(addr.toString('hex'));
        if (addr.toLowerCase() !== msgobj.from.toLowerCase()) {
            return callback(new Error('Signature is bad, not able to process message.'));
        } 
        
        // Check date
        if (checkDate) {
            var elapsed = new Date() - new Date(msgobj.timestamp);  // in milliseconds
            if (elapsed > self.ttv) {
                return callback(new Error('Message exceeds time limit to be valid.'));
            }         
        }
        callback(null, msgobj);
    });

}

/**
 * Send MQTTT signed message.
 * @param {String} to The receiver's address ('0x325454...').
 * @param {String/Buffer} data The data payload to send.
 * @param {String} type The type of the message. ['request', 'response', 'command']
 */
MQTTT.prototype.send = function (to, data, type)  {
    var self = this;
    var data = typeof data === 'String' ? data : data.toString();
    var msg = {
        from: self.account,
        to: to,
        timestamp: new Date().getTime(),
        type: type,     //'request/response/command'
        data: data,
        seqno: 0,
    };
    var msgHash = self.web3.sha3(JSON.stringify(msg));
    self.web3.eth.sign(self.account, msgHash, (err, result) => {
        if (err) throw err;
        msg.signature = result;
        self.mqttClient.publish(mqtttPeerAddress(to), JSON.stringify(msg));
    });
   
}

/**
 *  Stop listening and end MQTT client.
 */
MQTTT.prototype.stop = function() {
    var self = this;
    self.mqttClient.unsubscribe(mqtttPeerAddress(self.account));
    self.mqttClient.end();
}

/**
 * Return the node address.
 */
MQTTT.prototype.getAddress = function () {
    return this.account;
}

module.exports = MQTTT;
