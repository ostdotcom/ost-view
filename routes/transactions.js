var express = require('express')
var transactions  = require('../lib/webInterface/transactions')
var router = express.Router({mergeParams: true});


const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , coreConfig = require(reqPrefix + "/config/core_config")
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };

const transactionsMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var page = req.params.page;

	const webRPC = coreConfig.getWebRPC(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.transactionsInstance = new transactions(webRPC, chainDbConfig);

	req.page = page;

	next();
}



router.get("/recent/:page",transactionsMiddleware, function(req, res){

	req.transactionsInstance.getRecentTransactions(req.page)
		.then(function(requestResponse) {
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** transactions: /recent/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
 		});
});

router.get("/pending",transactionsMiddleware, function(req, res){

	req.transactionsInstance.getPendingTransactions()
		.then(function(requestResponse) {
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** transactions: /pending/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
 		});
});

module.exports = router;