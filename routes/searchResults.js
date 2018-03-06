"use strict";
/**
 * Search related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/search</b>
 *
 * @module Explorer Routes - Search
 */
const express = require('express');

// Express router to mount search related routes
const router = express.Router({mergeParams: true});

// load all internal dependencies
const rootPrefix = ".."
  , search = require(rootPrefix + '/models/search')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConfig = require(rootPrefix + '/config')
;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};


// define parameters from url, generate web rpc instance and database connect
const searchMiddleware = function (req, res, next) {
    const q = req.query.q
  ;

  req.q = q;

  next();
};

/**
 * Search by address, contract address, transaction hash, block number
 *
 * @name Search
 *
 * @route {GET} {base_url}/:param
 *
 * @routeparam {String} :params - search string
 */
router.get('/', searchMiddleware, function (req, res) {

    const response = responseHelper.successWithData({
      message: "Unable to find data you are looking for at this point of time. Query="+req.q,
      result_type: "search_results"
    });

    return renderResult(response, res, req.headers['content-type']);
});

module.exports = router;