
/**
 * @module routes/
 */


var express = require('express');
var contract = require('../lib/webInterface/contract')
var router = express.Router({mergeParams: true});

const reqPrefix           = "../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , coreConfig = require(reqPrefix + "/config")
    , logger = require(reqPrefix + '/helpers/CustomConsoleLogger')
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


const contractMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var contractAddress = req.params.contractAddress;
	var page = req.params.page;

	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.contractInstance = new contract(chainDbConfig);

	req.chainId = chainId;
	req.page = page;
	req.contractAddress = contractAddress;

	next();
}

/**
 * Get transactions in particualr contract address.
 * 
 *@param {String} contractAddress - contractAddress is of length 42.
 *@param {Integer} page - Page number for getting data in batch.
 * 
 *@return {Object} - return list block data.
 */
router.get("/:contractAddress/:page",contractMiddleware, function(req, res){

	req.contractInstance.getContractLedger(req.contractAddress, req.page)
		.then(function(requestResponse){
			const response = responseHelper.successWithData({
				contract_transactions: requestResponse,
				result_type : "contract_transactions"
			});

			return renderResult(response, res);		
		})
		.catch(function(reason){
			logger.log("****** contract: /:contractAddress/:page ***** catch ***** "+ reason);
			return renderResult( responseHelper.error('', reason),res );
		});
});


module.exports = router;