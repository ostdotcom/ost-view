"use strict";
/**
 * Index route.<br><br>
 * Base url for all routes given below is: <b>base_url = /</b>
 *
 * @module Explorer Routes - Index
 */
const express = require('express');

// Express router to mount index routes
var router = express.Router();

/**
 * Index route
 *
 * @name Index route
 *
 * @route {GET} {base_url}
 *
 */
router.get("/home", function(req, res, next){
    return res.render('home',{
          title: "Recent Blocks",
          //blocks: requestResponse
      });
  
});

router.get("/tokendetails", function(req, res, next){
    res.render('tokendetails', {
          coin_name: "Frenco Coin",
          contract_address: "0xt6yg7g7g7ghjh7798yuhhkjhu98987897"
          //blocks: requestResponse
      });
  
});

module.exports = router;