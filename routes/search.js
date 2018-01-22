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
const renderResult = function (requestResponse, responseObject) {
  return requestResponse.renderResponse(responseObject);
};

// define parameters from url, generate web rpc instance and database connect
const searchMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , param = req.params.param
  ;

  // create instance of search class
  req.searchInstance = new search(chainId);

  req.param = param;

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
router.get('/:param', searchMiddleware, function (req, res) {

  req.searchInstance.getParamData(req.param)
    .then(function (requestResponse) {
      console.log("search: inside * this * funciton")
      return renderResult(requestResponse, res);
    })
    .catch(function (reason) {
      console.log("****** search: /:param ***** catch ***** " + reason);
      return renderResult(responseHelper.error('', reason), res);

    });

});

module.exports = router;