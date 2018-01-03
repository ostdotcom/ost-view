var express = require('express');
var router = express.Router();

router.get("/recent", function(req, res, next){

	var count = req.query.count;

	var response = {} ; // block.something(count)

  if (req.params.format) { 
  	res.json({title:'Hello World'}); 
  }else {
    res.render('index', { title: 'Hello Block Scanner' });
  }
});
module.exports = router;