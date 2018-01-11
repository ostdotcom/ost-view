var express = require('express')
var address = require('../lib/webInterface/address')
var router = express.Router({mergeParams: true});

const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , coreConfig = require(reqPrefix + "/config/core_config")
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };



const addressMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var addressValue = req.params.address;
	var page = req.params.page;

	const webRPC = coreConfig.getWebRPC(chainId);
	const chainDbConfig = coreConfig.getChainDbConfig(chainId);

	req.addressInstance = new address(webRPC, chainDbConfig);

	req.addressValue = addressValue;
	req.page = page;

	next();
}
 

router.get('/:address', addressMiddleware, function(req, res){

 	req.addressInstance.getAddressData(req.addressValue)
	 	.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );

		});
});


router.get('/:address/balance', addressMiddleware, function(req, res){

 	req.addressInstance.getAddressBalance(req.addressValue)
 		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address/balance ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
		});
});

router.get('/:address/transactions/:page',addressMiddleware, function(req, res){


 	req.addressInstance.getAddressTransactions(req.addressValue, req.page)
 		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address/transaction/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
		});
});

module.exports = router;