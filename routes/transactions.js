
/**
 * @module routes/
 */


var express = require('express')
var transactions  = require('../lib/webInterface/transactions')
var router = express.Router({mergeParams: true});


const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , coreConfig = require(reqPrefix + "/config")
    , logger = require(reqPrefix + '/helpers/CustomConsoleLogger')
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };

const transactionsMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var page = req.params.page;

	const webRpcUrl = coreConfig.getWebRpcUrl(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.transactionsInstance = new transactions(webRpcUrl, chainDbConfig);

	req.page = page;

	next();
}


/**
 * Get recent transactions in batch.
 * 
 * @param {Integer} page - Page number for getting data in batch. 
 *	
 * @return {Object} - return list of transactions made by address.
 */
router.get("/recent/:page",transactionsMiddleware, function(req, res){

	req.transactionsInstance.getRecentTransactions(req.page)
		.then(function(requestResponse) {
			const response = responseHelper.successWithData({
				recent_transactions : requestResponse,
				result_type : "recent_transactions"
			});

			return renderResult(response, res);		 	
 		})
 		.catch(function(reason){
			logger.log("****** transactions: /recent/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('', reason),res );
 		});
});

/**
 * Get pending transactions 
 * 
 *	
 * @return {Object} - return list of pending transactions made by address.
 */
router.get("/pending",transactionsMiddleware, function(req, res){

	req.transactionsInstance.getPendingTransactions()
		.then(function(requestResponse) {
			const response = responseHelper.successWithData({
				pending_transactions : requestResponse,
				result_type : "pending_transactions"
			});

			return renderResult(response, res);		 	
		})
 		.catch(function(reason){
			logger.log("****** transactions: /pending/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('', reason),res );
 		});
});

module.exports = router;