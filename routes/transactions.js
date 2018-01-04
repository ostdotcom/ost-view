var express = require('express');
var transactions = require('../lib/webInterface/transactions')
var router = express.Router();


const reqPrefix           = "../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };

router.get("/recent/:page", function(req, res, next){

	var page = req.params.page;
	transactions.getRecentTransactions(page)
		.then(function(requestResponse) {
 			console.log("transactions: inside * this * funciton")
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** transactions: /recent/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
 		});
});

router.get("/pending/:page", function(req, res, next){

	var page = req.params.page;	

	transactions.getPendingTransactions(page)
		.then(function(requestResponse) {
 			console.log("transactions: inside * this * funciton")
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** transactions: /pending/:page ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
 		});
});

module.exports = router;