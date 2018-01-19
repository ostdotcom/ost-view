
/**
 * @module routes/
 */


var express = require('express')
var search 	= require('../lib/webInterface/search')
var router = express.Router({mergeParams: true});


const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , coreConfig = require(reqPrefix + "/config")
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


const searchMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var param = req.params.param;

	const webRpcUrl = coreConfig.getWebRpcUrl(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.searchInstance = new search(webRpcUrl, chainDbConfig);

	req.param = param;

	next();
}

/**
 * Get transcion, contract, block.
 * 
 *@param {string/Integer} param - param may contains address_hash, transaction_hash or block_number. 
 * 
 *@return {Object} - return list block data.
 */
router.get('/:param',searchMiddleware, function(req, res){


 	req.searchInstance.getParamData(req.param)
 		.then(function(requestResponse) {
 			console.log("search: inside * this * funciton")
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** search: /:param ***** catch ***** "+reason);
			return renderResult( responseHelper.error('', reason),res );

 		});

});

module.exports = router ;