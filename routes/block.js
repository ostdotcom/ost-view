var express = require('express');
var block = require('../lib/webInterface/block')
var router = express.Router();

router.get("/:block_number", function(req, res, next){

	var blockNumber = req.params.block_number;
	var blockData = block.getBlock(blockNumber)

	callbackData(req,res,blockData)
});


router.get("/:address/transactions/:page", function(req, res, next){

	var address = req.params.address;
	var page = req.params.page;

	var blockTransactions = block.getBlcokTransactions(address,page)

	callbackData(req,res,blockTransactions)
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