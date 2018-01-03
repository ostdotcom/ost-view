var express = require('express');
var transaction = require('../lib/webInterface/transaction')
var router = express.Router();

router.get("/:hash", function(req, res, next){
	
	var hash = req.params.hash;

	var hashTransactions = transaction.getTransaction(hash)

	callbackData(req,res,hashTransactions)
});

function callbackData(req,res,data) {
	var contype = req.headers['content-type'];

  	if (contype != undefined && (contype ==='application/json')){

  		res.json({data:data}); 
 	}else {
 		var jsonString = JSON.stringify(data,null,2);  
 	  	//res.render('index', { title: jsonString });
 	  	  		res.json({data:data}); 

	}
}

module.exports = router;