var express = require('express')
var search 	= require('../lib/webInterface/search')
var router = express.Router({mergeParams: true});


const reqPrefix           = ".."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


router.get('/:param',function(req, res, next){

	var param = req.params.param;

 	search.getParamData(param)
 		.then(function(requestResponse) {
 			console.log("search: inside * this * funciton")
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** search: /:param ***** catch ***** "+reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );

 		});

 	 			//callbackData(req, res, requestResponse)


});

module.exports = router ;