var express = require('express');
var block   = require('../lib/webInterface/block')
var router = express.Router({mergeParams: true});

const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , coreConfig = require(reqPrefix + "/config")
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


const blockMiddleware = function(req,res, next){
	var blockNumber = req.params.block_number;
	var chainId = req.params.chainId;
	var page = req.params.page;


	const webRPC = coreConfig.getWebRPC(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.blockInstance = new block(webRPC, chainDbConfig);

	req.blockNumber = blockNumber;
	req.chainId = chainId;
	req.page = page;

	next();
}

router.get("/:block_number", blockMiddleware, function(req, res){

	req.blockInstance.getBlock(req.blockNumber)
		.then(function(requestResponse){

			const response = responseHelper.successWithData({
				block: requestResponse
			});

			return renderResult(response, res);
		})
		.catch(function(reason){
			console.log("****** block: /:block_number ***** catch ***** " + reason);
				
			return renderResult( responseHelper.error('', reason),res );
        });
});


router.get("/:block_number/transactions/:page", blockMiddleware, function(req, res){

	req.blockInstance.getBlockTransactions(req.blockNumber,req.page)
		.then(function(requestResponse){

			const response = responseHelper.successWithData({
				transactions: requestResponse
			});

			return renderResult(response, res);
		})
		.catch(function(reason){
			console.log("****** block: /:address/transactions/:page ***** catch ***** " + reason);
			return renderResult( responseHelper.error('', reason),res );
		});
});



module.exports = router;