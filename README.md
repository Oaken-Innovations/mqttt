# MQTT-Trusted

The trusted messaging framework based on MQTT and crypto signatures.

## Installation

`npm install --save mqttt`

## Usage

### Message JSON format

```bash
{
    "from": "",
    "to": "",
    "timestamp": new Date().getTime(),
    "type": "request"/"response"/"command", 
    "data": "",
    "seqno": 0,
}

```

### MQTTT APIs

- mqttt.deriveHDAccount(mnemonic, rpcserver, idx)


### MQTTT Client APIs

- client = new mqttt.MQTTT(address, signer, mqtt_broker_url, [ttv])
- client.send(to, data, type)
- client.listen(checkDate, (err, msg) => {})
- client.stop()

### Signer APIs

- web3Signer = new mqttt.signers.Web3Singer(web3, signHash, recoverHash)
- privkeySigner = new mqttt.signers.PrivKeySigner(privkey, signHash, recoverHash)
- signer.sign(msg, account, callback)
- signer.recover(msg, sig, callback)

**signHash** is the type of the hash before feeding the message to the web3 `eth_sign` function.
Providing the flexsibility to specify the hash type is to work around the incompatible 
`eth_hash` API since `geth 1.5`. For **signHash**, you can specify 'hash', 'hashPersonal' 
and 'nohash'. For **recoverHash**, you can specify 'hash' and 'hashPersonal'.

## Examples

Check `examples/` for more usages.

## License

Apache-2.0



