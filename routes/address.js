var express = require('express')
var address = require('../lib/webInterface/address')
var router = express.Router();


router.get('/:address?',function(req, res, next){

	var addressValue = req.params.address;

	console.log("****** addressValue*****", addressValue)
 	var addressData = address.getAddressData(addressValue);

	callbackData(req, res, addressData)
});


router.get('/:address/balance',function(req, res, next){

	var addressValue = req.params.address;

	console.log("****** addressValue balance*****", addressValue)
 	var addressBalance = address.getAddressBalance(addressValue);

	callbackData(req, res, addressBalance)
});

router.get('/:address/transaction/:page', function(req, res, next){

	var addressValue = req.params.address;
	var page = req.params.page;

 	var addressTransaction = address.getAddressTransactions(addressValue, page);

	callbackData(req, res, addressTransaction);
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