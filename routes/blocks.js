var express = require('express');
var blocks = require('../lib/webInterface/blocks')
var router = express.Router();

router.get("/recent/:page", function(req, res, next){

	var page = req.params.page;

	var recentBlocks = blocks.getRecentBlocks(page)

	callbackData(req,res,recentBlocks)
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