var express = require('express');
var blocks = require('../lib/webInterface/blocks')
var router = express.Router({mergeParams: true});

const reqPrefix           = "../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


const blocksMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var page = req.params.page;

	req.blocksInstance = new blocks("");

	req.chainId = chainId;
	req.page = page;

	next();
}

router.get("/recent/:page",blocksMiddleware, function(req, res){


	req.blocksInstance.getRecentBlocks(req.page)
		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** blocks: /recent/:page ***** catch ***** "+ reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
		});
});


module.exports = router;