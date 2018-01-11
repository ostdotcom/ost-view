var express = require('express');
var block   = require('../lib/webInterface/block')
var router = express.Router({mergeParams: true});

const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


const blockMiddleware = function(req,res, next){
	var blockNumber = req.params.block_number;
	var chainId = req.params.chainId;
	var page = req.params.page;

	req.blockInstance = new block("");

	req.blockNumber = blockNumber;
	req.chainId = chainId;
	req.page = page;

	next();
}


router.get("/:block_number", blockMiddleware, function(req, res){

	req.blockInstance.getBlock(req.blockNumber)
		.then(function(requestResponse){
			console.log(requestResponse);

			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** block: /:block_number ***** catch ***** " + reason);
				
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
        });
});


router.get("/:block_number/transactions/:page", blockMiddleware, function(req, res){

	req.blockInstance.getBlockTransactions(req.blockNumber,req.page)
		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** block: /:address/transactions/:page ***** catch ***** " + reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
		});
});



module.exports = router;