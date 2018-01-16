var express = require('express');
var contract = require('../lib/webInterface/contract')
var router = express.Router({mergeParams: true});

const reqPrefix           = "../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , coreConfig = require(reqPrefix + "/config/core_config")
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


const contractMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var contractAddress = req.params.contractAddress;
	var page = req.params.page;

	const webRPC = coreConfig.getWebRPC(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.contractInstance = new contract(webRPC, chainDbConfig);

	req.chainId = chainId;
	req.page = page;
	req.contractAddress = contractAddress;

	next();
}

router.get("/:contractAddress/:page",contractMiddleware, function(req, res){

	req.contractInstance.getContractLedger(req.contractAddress, req.page)
		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** contract: /:contractAddress/:page ***** catch ***** "+ reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
		});
});


module.exports = router;