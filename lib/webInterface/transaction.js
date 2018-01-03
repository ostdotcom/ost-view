"use strict"

var transaction = {

	getTransaction : function(hash){

		if (!hash || typeof hash !== 'string') {
			return;
		}
		return getDummyTransaction(hash);
	}
}

function getDummyTransaction(hash) {
	var transaction	= {
		  blockHash: "0x0778a76a37f823088d8f7fe59773bc5408e727015e7d0409fd7630ae9b4195fe",
		  blockNumber: 123,
		  from: "0xae877859b9ab12275d5a90f44663508e36f75d46",
		  gas: 90000,
		  gasPrice: 18000000000,
		  hash: hash,
		  input: "0x",
		  nonce: 21,
		  r: "0xe9fd4478c3dbaaecb924f1efefb539a08a8946d34b682568c431f92a2f46daba",
		  s: "0x2beadd8197b4c8c0447edc1db465237b5cf9e8701023d4d0ce2ebc284066cce6",
		  to: "0x13cc344aa7699818201315f0ab47dded53f83d7a",
		  transactionIndex: 0,
		  v: "0x41",
		  value: 2000
	}
	return transaction;

}

module.exports = transaction;