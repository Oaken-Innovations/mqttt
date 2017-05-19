const ethjsUtil = require('ethereumjs-util');

/**
 * Web3 signer.
 * @constructor
 * @param web3 The web3 instance.
 * @param {String} signHash The hash type when signing message, including 'hash, hashPersonal, nohash'.
 * @param {String} recoverHash The hash type when recovering message, including 'hash, hashPersonal'.
 *      Whether the eth_sign of the web3 implementation adds prefix and keccack256 the prefixed message. 
 *      See https://github.com/ethereum/go-ethereum/pull/2940
 */
function Web3Signer(web3, signHash, recoverHash) {
    var self = this;
    self.web3 = web3;
    if (typeof signHash === 'undefined' || typeof recoverHash === 'undefined') {
        throw new Error('You need to specify signHash and recoverHash!');
    }
    self.signHash = signHash;
    self.recoverHash = recoverHash;
}

/**
 * Sign message with web3.
 * @param {String} msg The raw message.
 * @param {String} account The account in use to sign the message.
 * @param callback The (err, result) style callback function.
 */
Web3Signer.prototype.sign = function (msg, account, callback) {
    var self = this;
    var msgToSign = ethjsUtil.bufferToHex(new Buffer(msg));     // nohash
    if (self.signHash === 'hash') {
        msgToSign = ethjsUtil.bufferToHex(ethjsUtil.sha3(msg));
    } else if (self.signHash === 'hashPersonal') {
        msgToSign = ethjsUtil.bufferToHex(ethjsUtil.hashPersonalMessage(new Buffer(msg)));
    }
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
    var msgHash =  self.recoverHash === 'hashPersonal' ? ethjsUtil.hashPersonalMessage(new Buffer(msg)) 
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
