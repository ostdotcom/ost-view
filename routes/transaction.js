
/**
 * @module routes/
 */


var express = require('express');
var transaction = require('../lib/webInterface/transaction')
var router = express.Router({mergeParams: true});


const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + '/lib/formatter/response' )
    , coreConfig = require(reqPrefix + "/config")
    , logger = require(reqPrefix + '/helpers/CustomConsoleLogger')
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };



const transactionMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var hash = req.params.hash;
	var page = req.params.page;

	const webRpcUrl = coreConfig.getWebRpcUrl(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.transactionInstance = new transaction(webRpcUrl, chainDbConfig);

	req.hash = hash;
	req.page = page;

	next();
}

/**
 * Get transaction details from hash
 * 
 * @param {String} hash - Address is of length 66.
 *	
 * @return {Object} - return transaction.
 */
router.get("/:hash",transactionMiddleware, function(req, res){
	
	req.transactionInstance.getTransaction(req.hash)
		.then(function(requestResponse) {
			
			const response = responseHelper.successWithData({
				transaction: requestResponse,
				result_type : "transaction"
			});

			return renderResult(response, res);		 	
		})
 		.catch(function(reason){
			logger.log("****** transaction: /:hash ***** catch ***** " + reason);
			return renderResult( responseHelper.error('', reason),res );
 		});
});

/**
 * Get transaction ledger in batch.
 * 
 * @param {String} hash - hash is of length 42.
 * @param {Integer} page - Page number for getting data in batch. 
 *	
 * @return {Object} - return list of transaction ledger.
 */
router.get("/:hash/address_transaction/:page",transactionMiddleware, function(req, res){
	
	req.transactionInstance.getAddressTransactions(req.hash, req.page)
		.then(function(requestResponse) {
			const response = responseHelper.successWithData({
				address_transaction: requestResponse,
				result_type : "address_transaction"
			});

			return renderResult(response, res);	
 		})
 		.catch(function(reason){
			logger.log("****** transaction: /:hash ***** catch ***** " + reason);
			return renderResult( responseHelper.error('', reason),res );
 		});
});

module.exports = router;