var express = require('express');
var transaction = require('../lib/webInterface/transaction')
var router = express.Router({mergeParams: true});


const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + '/lib/formatter/response' )
    , coreConfig = require(reqPrefix + "/config")
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };



const transactionMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var hash = req.params.hash;
	var page = req.params.page;

	const webRPC = coreConfig.getWebRPC(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.transactionInstance = new transaction(webRPC, chainDbConfig);

	req.hash = hash;
	req.page = page;

	next();
}


router.get("/:hash",transactionMiddleware, function(req, res){
	
	req.transactionInstance.getTransaction(req.hash)
		.then(function(requestResponse) {
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** transaction: /:hash ***** catch ***** " + reason);
			return renderResult( responseHelper.error('', reason),res );
 		});
});

router.get("/:hash/address_transaction/:page",transactionMiddleware, function(req, res){
	
	req.transactionInstance.getAddressTransactions(req.hash, req.page)
		.then(function(requestResponse) {
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** transaction: /:hash ***** catch ***** " + reason);
			return renderResult( responseHelper.error('', reason),res );
 		});
});

module.exports = router;