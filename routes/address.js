var express = require('express')
var address = require('../lib/webInterface/address')
var router = express.Router({mergeParams: true});

const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , coreConfig = require(reqPrefix + "/config")
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


const addressMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var addressValue = req.params.address;
	var page = req.params.page;
	var contractAddress = req.params.contractAddress;

	const webRPC = coreConfig.getWebRPC(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.addressInstance = new address(webRPC, chainDbConfig);

	req.addressValue = addressValue;
	req.page = page;
	req.contractAddress = contractAddress;
	
	next();
}

const balanceIndex = 0;
const transactionsIndex = 1; 
const defaultPageNumber = 1;

const balanceKey = "balance";
const transactionsKey = "transactions";

router.get('/:address', addressMiddleware, function(req, res){

	var promiseResolvers = [];

  	promiseResolvers.push(req.addressInstance.getAddressBalance(req.addressValue));
    promiseResolvers.push(req.addressInstance.getAddressTransactions(req.addressValue, defaultPageNumber));        

	  Promise.all(promiseResolvers).then(function(rsp) {
		
		const balance = rsp[balanceIndex].data;
		const transactions = rsp[transactionsIndex].data

		const responseObject = {};
		responseObject[balanceKey] = balance;
		responseObject[transactionsKey] = transactions;

		return renderResult(responseHelper.successWithData(responseObject), res);
	  });
});


router.get('/:address/balance', addressMiddleware, function(req, res){

 	req.addressInstance.getAddressBalance(req.addressValue)
 		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address/balance ***** catch ***** "+reason);
			return renderResult( responseHelper.error('', reason),res );
		});
});

router.get('/:address/transactions/:page',addressMiddleware, function(req, res){


 	req.addressInstance.getAddressTransactions(req.addressValue, req.page)
 		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address/transaction/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('', reason),res );
		});
});

router.get('/:address/contract/:contractAddress/:page',addressMiddleware, function(req, res){


 	req.addressInstance.getAddressLedgerInContract(req.addressValue, req.contractAddress, req.page)
 		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address/contract/:contractAddress/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('', reason),res );
		});
});


router.get('/:address/internal_transactions/:page',addressMiddleware, function(req, res){


 	req.addressInstance.getAddressTransactions(req.addressValue, req.page)
 		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address/internal_transactions/:page ***** catch ***** " + reason);
			return renderResult( responseHelper.error('', reason),res );
		});
});

module.exports = router;