var express = require('express');
var block = require('../lib/webInterface/block')
var router = express.Router();


const reqPrefix           = "../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };

router.get("/:block_number", function(req, res, next){

	var blockNumber = req.params.block_number;
	block.getBlock(blockNumber)
		.then(function(requestResponse){
			console.log(requestResponse);

			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** block: /:block_number ***** catch ***** " + reason);
				
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
         });
});


router.get("/:address/transactions/:page", function(req, res, next){

	var address = req.params.address;
	var page = req.params.page;

	block.getBlcokTransactions(address,page)
		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** block: /:address/transactions/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
		});
});



module.exports = router;