"use strict"

//All module required.
const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
;

const maxCount = 2

var transactions = {

	getRecentTransactions : function(page) {

	    return new Promise(function(resolve, reject){
	    	
	    	if (page == undefined || isNaN(page)) {
				reject('invalid input');
								return;

			}

	    	if (!page || page < 0) {
				page = 0;
			}
			var transactionsArray = [];
	    	var startIndex =  (page * maxCount);

			for (var i = startIndex; i < (startIndex+maxCount); i++){
				transactionsArray.push(getDummyTransaction(i));
			}

			var response = responseHelper.successWithData( transactionsArray );
			resolve(response);
		})
		
	}

	,getPendingTransactions : function(page){

		return new Promise(function(resolve, reject){

			if (page == undefined || isNaN(page)) {
				reject('invalid input');
			}

			if (!page || page < 0) {
				page = 0;
			}
			var pendingTransactionsArray = [];
	    	var startIndex =  (page * maxCount);

			for (var i = startIndex; i < (startIndex+maxCount); i++){

				pendingTransactionsArray.push(getDummyPendingTransaction(i));
			}

			var response = responseHelper.successWithData( pendingTransactionsArray );
			resolve(response);

		});
	}
}


function getDummyTransaction(page) {
	var transaction	= {
		  blockHash: "0x0778a76a37f823088d8f7fe59773bc5408e727015e7d0409fd7630ae9b4195fe",
		  blockNumber: page,
		  from: "0xae877859b9ab12275d5a90f44663508e36f75d46",
		  gas: 90000,
		  gasPrice: 18000000000,
		  hash: "0x0e98e5f71cada976a4e1e67bb7a820ed6a5aeb9a4a5e220c9aab7594c29e2283",
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


function getDummyPendingTransaction() {
	var pendingTrancsaction = {
		blockHash: null,
	    blockNumber: null,
	    from: "0xae877859b9ab12275d5a90f44663508e36f75d46",
	    gas: 90000,
	    gasPrice: 18000000000,
	    hash: "0x1bb8e900aef2a580ea76ec5e87ae341ba516964ea4023d2e7d36e4dfbedb6d3f",
	    input: "0x",
	    nonce: 22,
	    r: "0xe1bcf76633381a6b66afafbec25fa4d23ab95fa98620006a52abbb98b23c6d7",
	    s: "0x74c65e6cacdc9e70f2a38ddc326ffff3b3e3af32582926faeec76d0300efcccd",
	    to: "0x13cc344aa7699818201315f0ab47dded53f83d7a",
	    transactionIndex: 0,
	    v: "0x42",
	    value: 2000
	}
	return responseHelper.successWithData( pendingTrancsaction );
}

module.exports = transactions;