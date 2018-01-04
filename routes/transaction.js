var express = require('express');
var transaction = require('../lib/webInterface/transaction')
var router = express.Router();


const reqPrefix           = "../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
;


const renderResult = function(requestResponse, responseObject) {
    return requestResponse.renderResponse(responseObject);
  };


router.get("/:hash", function(req, res, next){
	
	var hash = req.params.hash;

	transaction.getTransaction(hash)
		.then(function(requestResponse) {
 			console.log("transaction: inside * this * funciton")
			 return renderResult(requestResponse, res);
 		})
 		.catch(function(reason){
			console.log("****** transaction: /:hash ***** catch ***** " + reason);
			return renderResult( responseHelper.error('r_wi_1', "Something Went Wrong"),res );
 		});
});

// function callbackData(req,res,data) {
// 	var contype = req.headers['content-type'];

//   	if (contype != undefined && (contype ==='application/json')){

//   		res.json({data:data}); 
//  	}else {
//  		var jsonString = JSON.stringify(data,null,2);  
//  	  	res.render('index', { title: jsonString });
//  	  	//  		res.json({data:data}); 

// 	}
// }

module.exports = router;