const ethjsUtil = require('ethereumjs-util');
const mqtt = require('mqtt');
const HDWalletProvider = require('truffle-hdwallet-provider');
const util = require('util');

const signers = require('./signers');

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
function MQTTT(account, signer, broker, ttv) {
    var self = this;
    self.account = account;
    self.signer = signer;
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
            return;
        }
        if(typeof msgobj.signature === 'undefined') {
            msgobj.signed = false;
            return callback(null, msgobj);
        }
        var sig = msgobj.signature;
        delete msgobj['signature'];
        self.signer.recover(JSON.stringify(msgobj), sig, (err, result) => {
            if (err) throw err;
            var addr = result;
            if (addr.toLowerCase() !== msgobj.from.toLowerCase()) {
                return callback(new Error('Signature is bad, not able to process message.'));
            } 
            if (checkDate) {
                var elapsed = new Date() - new Date(msgobj.timestamp);  // in milliseconds
                if (elapsed > self.ttv) {
                    return callback(new Error('Message exceeds time limit to be valid.'));
                }         
            }
            msgobj.signed = true;
            callback(null, msgobj);
        });
        
    });

}

/**
 * Send MQTTT signed message.
 * @param {String} to The receiver's address ('0x325454...').
 * @param {String/Buffer} data The data payload to send.
 * @param {String} type The type of the message. ['request', 'response', 'command']
 * @param {Boolean} Whether to sign the message.
 */
MQTTT.prototype.send = function (to, data, type, signMsg)  {
    var self = this;
    signMsg = typeof signMsg === 'undefined' ? true : signMsg;
    var data = typeof data === 'String' ? data : data.toString();
    var msg = {
        from: self.account,
        to: to,
        timestamp: new Date().getTime(),
        type: type,     //'request/response/command'
        data: data,
        seqno: 0,
    };
    if (signMsg) {
        self.signer.sign(JSON.stringify(msg), self.account, (err, result) => {
            if (err) throw err;
            msg.signature = result;
            self.mqttClient.publish(mqtttPeerAddress(to), JSON.stringify(msg));
        });
    } else {
        self.mqttClient.publish(mqtttPeerAddress(to), JSON.stringify(msg));
    }
   
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

/**
 * Derive a HD account for private key signer.
 * It's based on the truffle HD wallet provider. 
 *     https://github.com/trufflesuite/truffle-hdwallet-provider
 * @param {String} mnemonic The mnemonic for HD wallet generation. 
 * @param {String} rpcserver The RPC server url (ex. https://ropsten.infura.io).
 * @param {Number} idx The account index.
 * @returns {account, privkey}
 */
function deriveHDAccount(mnemonic, rpcserver, idx) {
    var provider = new HDWalletProvider(mnemonic, rpcserver, idx)
    return { 
        account: provider.getAddress(), 
        privkey: ethjsUtil.addHexPrefix(provider.wallet.getPrivateKey().toString('hex')),
        provider: provider
    };
}

module.exports = {
    MQTTT: MQTTT,
    signers: signers,
    deriveHDAccount: deriveHDAccount
}

