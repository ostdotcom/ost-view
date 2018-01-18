var express = require('express');
var blocks = require('../lib/webInterface/blocks')
var router = express.Router({mergeParams: true});

const reqPrefix           = "../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , coreConfig = require(reqPrefix + "/config")
    , logger = require(reqPrefix + '/helpers/CustomConsoleLogger')
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


const blocksMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var page = req.params.page;

	const webRPC = coreConfig.getWebRPC(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.blocksInstance = new blocks(webRPC, chainDbConfig);

	req.chainId = chainId;
	req.page = page;

	next();
}

router.get("/recent/:page",blocksMiddleware, function(req, res){


	req.blocksInstance.getRecentBlocks(req.page)
		.then(function(requestResponse){
			const response = responseHelper.successWithData({
				blocks: requestResponse
			});

			return renderResult(response, res);		
		})
		.catch(function(reason){
			logger.log("****** blocks: /recent/:page ***** catch ***** "+ reason);
			return renderResult( responseHelper.error('', reason),res );
		});
});


module.exports = router;