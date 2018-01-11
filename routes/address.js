var express = require('express')
var address = require('../lib/webInterface/address')
var router = express.Router({mergeParams: true});

const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };

router.get('/:address',function(req, res, next){

	var addressValue = req.params.address;
 	address.getAddressData(addressValue)
	 	.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );

		});
});


router.get('/:address/balance',function(req, res, next){

	var addressValue = req.params.address;
 	address.getAddressBalance(addressValue)
 		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address/balance ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
		});
});

router.get('/:address/transactions/:page', function(req, res, next){

	var addressValue = req.params.address;
	var page = req.params.page;

 	address.getAddressTransactions(addressValue, page)
 		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** address: /:address/transaction/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
		});
});





module.exports = router;