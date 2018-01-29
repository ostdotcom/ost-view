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
    res.render('home',{
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

router.get('/yell', function (req, res, next) {
    res.render('yell', {
        title: '/Yell/title',

        // This `message` will be transformed by our `yell()` helper.
        message: '/yell/message'
    });
});

router.get('/exclaim', function (req, res) {
    res.render('yell', {
        title  : 'Exclaim',
        message: '/yell/message',

        helpers: {
            yell: function (msg) {
                return (msg + '!!!');
            },

            new: function (msg){
                return (msg+" new !!!");
            }
        }
    });
});

router.get('/list', function (req, res) {
    res.render('list', {
        title  : 'list',
        message: '/list/message',

        people: [
          {firstName: "Yehuda", lastName: "Katz"},
          {firstName: "Carl", lastName: "Lerche"},
          {firstName: "Alan", lastName: "Johnson"}
        ],
        
    });
});

module.exports = router;