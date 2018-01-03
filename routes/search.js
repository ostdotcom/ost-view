var express = require('express')
var search = require('../lib/webInterface/search')
var router = express.Router();


router.get('/:param',function(req, res, next){

	var param = req.params.param;

	console.log("****** addressValue*****", param)
 	var transaction = search.getParamData(param);

	callbackData(req, res, transaction)
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


module.exports = router ;