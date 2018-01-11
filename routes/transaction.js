var express = require('express');
var transaction = require('../lib/webInterface/transaction')
var router = express.Router({mergeParams: true});


const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + '/lib/formatter/response' )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };



const transactionMiddleware = function(req,res, next){
	var chainId = req.params.chainId;
	var hash = req.params.hash;

	req.transactionInstance = new transaction("");

	req.hash = hash;

	next();
}


router.get("/:hash",transactionMiddleware, function(req, res){
	

	req.transactionInstance.getTransaction(req.hash)
		.then(function(requestResponse) {
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** transaction: /:hash ***** catch ***** " + reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
 		});
});



module.exports = router;