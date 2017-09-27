# <img src="https://ipfs.io/ipfs/QmPZBmoax3jgp5UMKBdfrvvEXat7fmc8NvyJbQXn5zgfTR" width="180" alt="MQTTT Logo">

MQTT-Trusted is the trusted messaging framework based on MQTT and crypto signatures.

## Installation

`npm install --save mqttt`

## Usage

### Message JSON format

```bash
{
    "from": "",
    "to": "",
    "timestamp": new Date().getTime(),
    "type": "request"/"response"/"command"/"service"/"notification", 
    "data": "",
    "seqno": 0,
}

```

### MQTTT APIs

- mqttt.deriveHDAccount(mnemonic, rpcserver, idx)


### MQTTT Client APIs

- client = new mqttt.MQTTT(address{String}, signer{Signer}, mqtt_broker_url{String}, [ttv]{Number})
- client.send(to{String}, data{String/Buffer}, type{String})
- client.listen(checkDate{Boolean}, (err{Error}, msg{String}) => {})
- client.stop()
- client.subscribe(topic{String})
- client.unsubscribe(topic{String})

**Note:** `client.send` to topic (starts with '/') instead of target address witll be sent as *broadcast*.

### Signer APIs

Currently the library supports `Web3Signer`, `PrivKeySigner` and `HardwareSigner`. `HardwareSigner` 
requires the compatible hardware and signing api on the hardware.

- web3Signer = new mqttt.signers.Web3Singer(web3, signHash, recoverHash)
- privkeySigner = new mqttt.signers.PrivKeySigner(privkey, signHash, recoverHash)
- hardwareSigner = new mqttt.signers.HardwareSigner(hsmClient, signHash, recoverHahs)
- signer.sign(msg, account, callback)
- signer.recover(msg, sig, callback)

**signHash** is the type of the hash before feeding the message to the web3 `eth_sign` function.
Providing the flexsibility to specify the hash type is to work around the incompatible 
`eth_hash` API since `geth 1.5`. For **signHash**, you can specify 'hash', 'hashPersonal' 
and 'nohash'. For **recoverHash**, you can specify 'hash' and 'hashPersonal'.

## Examples

Check `examples/` for more usages.

## TODO
- [ ] Add hashing method negotiation.
- [ ] Publish RFC documents on common message types and common topic naming conventions.


## License

Apache-2.0



