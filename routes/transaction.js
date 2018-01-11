var express = require('express');
var transaction = require('../lib/webInterface/transaction')
var router = express.Router({mergeParams: true});


const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + '/lib/formatter/response' )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


router.get("/:hash", function(req, res, next){
	
	var hash = req.params.hash;

	transaction.getTransaction(hash)
		.then(function(requestResponse) {
			 return renderResult(responseHelper.successWithData(requestResponse), res);
 		})
 		.catch(function(reason){
			console.log("****** transaction: /:hash ***** catch ***** " + reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
 		});
});



module.exports = router;