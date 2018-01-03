var express = require('express');
var transactions = require('../lib/webInterface/transactions')
var router = express.Router();

router.get("/recent/:page", function(req, res, next){

	var page = req.params.page;
	var recentTransactions = transactions.getRecentTransactions(page)

	callbackData(req,res,recentTransactions)
});

router.get("/pending/:page", function(req, res, next){

	var page = req.params.page;	

	var pendingTransactions = transactions.getPendingTransactions(page)

	callbackData(req,res,pendingTransactions)
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