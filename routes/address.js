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


	console.log("********* 0 *******");

		testFunction(addressValue);


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


const testModule = require("./test")

function testFunction (address){

 	console.log("********* 1. instance *******");
 	var test = testModule.getInstance("http://127.0.0.1:3000");
 	console.log(test);

 	console.log("********* 2. instance *******");
 	var test1 = testModule.getInstance("http://127.0.0.2:3000");
 	console.log(test1);

 	console.log("********* 3. instance *******");
 	//var test2 = testModule.getInstance("http://127.0.0.1:3000");
 	//console.log(test2);
 	//test2.case1(address)

 	testModule.getInstance("http://127.0.0.1:3000").case1(address);

}

module.exports = router;