var express = require('express');
var blocks = require('../lib/webInterface/blocks')
var router = express.Router({mergeParams: true});

const reqPrefix           = "../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


router.get("/recent/:page", function(req, res, next){

	var page = req.params.page;

	blocks.getRecentBlocks(page)
		.then(function(requestResponse){
			 return renderResult(requestResponse, res);
		})
		.catch(function(reason){
			console.log("****** blocks: /recent/:page ***** catch ***** "+ reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
		});
});


module.exports = router;