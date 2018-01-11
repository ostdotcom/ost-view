var express = require('express')
var address = require('../lib/webInterface/address')
var router = express.Router({mergeParams: true});

const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };



const addressMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var addressValue = req.params.address;
	var page = req.params.page;

	req.addressInstance = new address("");

	req.addressValue = addressValue;
	req.page = page;

	next();
}
 

router.get('/:address', addressMiddleware, function(req, res){

	console.log("********* 0 *******");

		testFunction(req.addressValue);


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