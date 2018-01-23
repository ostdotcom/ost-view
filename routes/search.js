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
    , q = req.query.q
  ;

  // create instance of search class
  req.searchInstance = new search(chainId);

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

  req.searchInstance.getParamData(req.q)
    .then(function (requestResponse) {
    	const response = responseHelper.successWithData({
        redirect_url: "http://"+req.headers.host+"/chain-id/"+req.params.chainId+requestResponse,
        result_type: "redirect_url"
      });

      return renderResult(response, res);
    })
    .catch(function (reason) {
      return renderResult(responseHelper.error('', reason), res);
    });
});

module.exports = router;