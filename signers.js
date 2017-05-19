const ethjsUtil = require('ethereumjs-util');

/**
 * Web3 signer.
 * @constructor
 * @param web3 The web3 instance.
 * @param {Boolean} hashPersonal: Whether the eth_sign of the web3 implementation
 *      adds prefix and keccack256 the prefixed message. 
 *      See https://github.com/ethereum/go-ethereum/pull/2940
 */
function Web3Signer(web3, hashPersonal) {
    var self = this;
    self.web3 = web3;
    self.hashPersonal = hashPersonal === 'undefined' ? false : hashPersonal;
}

/**
 * Sign message with web3.
 * @param {String} msg The raw message.
 * @param {String} account The account in use to sign the message.
 * @param callback The (err, result) style callback function.
 */
Web3Signer.prototype.sign = function (msg, account, callback) {
    var self = this;
    var msgToSign = self.hashPersonal ? ethjsUtil.bufferToHex(new Buffer(msg)) : ethjsUtil.bufferToHex(ethjsUtil.sha3(msg));
    self.web3.eth.sign(account, msgToSign, callback);
}

/**
 * Recover address with web3.
 * @param {String} msg The raw message.
 * @param {String} sig the RPC style signature string.
 * @param callback The (err, result) style callback function.
 */
Web3Signer.prototype.recover = function (msg, sig, callback) {
    var self = this;
    var sigParams = ethjsUtil.fromRpcSig(sig); 
    var msgHash = self.hashPersonal ? ethjsUtil.hashPersonalMessage(new Buffer(msg)) 
        : ethjsUtil.sha3(msg);
    var pubkey = ethjsUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s);
    var addr = ethjsUtil.pubToAddress(pubkey);
    addr = ethjsUtil.addHexPrefix(addr.toString('hex'));   
    callback(null, addr);
}


/**
 * Private key signer.
 * @constructor
 * @param {String} privkey The private key in use.
 * @param {Boolean} hashPersonal.
 */
function PrivKeySigner(privkey, hashPersonal) {
    var self = this;
    self.privkey = privkey;
    self.hashPersonal = hashPersonal === 'undefined' ? false : hashPersonal;
}


PrivKeySigner.prototype.sign = function (msg, account, callback) {
    var self = this;
    var msgHash = self.hashPersonal ? ethjsUtil.hashPersonalMessage(new Buffer(msg)) 
        : ethjsUtil.sha3(msg);
    var sig = ethjsUtil.ecsign(msgHash, ethjsUtil.toBuffer(self.privkey));
    callback(null, ethjsUtil.toRpcSig(sig.v, sig.r, sig.s));
}

PrivKeySigner.prototype.recover = function (msg, sig, callback) {
    var self = this;
    var msgHash = self.hashPersonal ? ethjsUtil.hashPersonalMessage(new Buffer(msg)) 
        : ethjsUtil.sha3(msg);
    var sigParams = ethjsUtil.fromRpcSig(sig);
    var pubkey = ethjsUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s);
    var addr = ethjsUtil.pubToAddress(pubkey);
    addr = ethjsUtil.addHexPrefix(addr.toString('hex'));   
    callback(null, addr);
}


function HardwareSigner() {
}

module.exports = {
    Web3Signer: Web3Signer,
    PrivKeySigner: PrivKeySigner
}
