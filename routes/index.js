var express = require('express');
var router = express.Router();

/* GET home page. */
router.get("/:format?", function(req, res, next){
  if (req.params.format) { res.json({title:'Hello World'}); }
  else {
    res.render('index', { title: 'Hello Block Scanner' });
  }
});
module.exports = router;