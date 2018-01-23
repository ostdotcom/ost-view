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
router.get("/:format", function(req, res, next){
  if (req.params.format) { 
    res.render('home', { title: 'Hello Block Scanner', body:"Hello" });
  }
});
module.exports = router;