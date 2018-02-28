"use strict";
/**
 * Index route.<br><br>
 * Base url for all routes given below is: <b>base_url = /</b>
 *
 * @module Explorer Routes - Index
 */
const express = require('express');

// Express router to mount search related routes
const router = express.Router({mergeParams: true});

const rootPrefix = ".."
  , home = require(rootPrefix + '/models/home')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConfig = require(rootPrefix + '/config')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , search = require(rootPrefix + '/models/search')

  ;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};

// define parameters from url, generate web rpc instance and database connect
const homeMiddleware = function (req, res, next) {
  var chainId = req.params.chainId
    ;
  if(undefined === chainId){
    chainId = coreConstant['CHAIN_ID'];
  }
  // Get instance of contract class
  req.homeInstance = new home(chainId);

  req.chainId = chainId;

  next();
};


/**
 * Index route
 *
 * @name Index route
 *
 * @route {GET} {base_url}
 *
 */
router.get("/",homeMiddleware, function(req, res){
  fetchHomeData(req, res);
});


/**
 * Index route
 *
 * @name Index route
 *
 * @route {GET} {base_url}
 *
 */
router.get("/home",homeMiddleware, function(req, res){
    fetchHomeData(req, res);
});


function fetchHomeData (req, res){
  req.homeInstance.getHomeData()
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        home: requestResponse,
        result_type: "home",
        mCss:['mTokenDetails.css'],
        mJs:['mHome.js'],
        view_data:req.homeInstance.getChainInfo(requestResponse),
        meta:{
          "top_tokens_url" : "/chain-id/"+req.chainId+"/tokens/top",
          "latest_token_transfer_url" : "/chain-id/"+req.chainId+"/tokens/transactions/recent"
        }
      });

      return renderResult(response, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
}



// define parameters from url, generate web rpc instance and database connect
const searchMiddleware = function (req, res, next) {
  var chainId = req.params.chainId
    , q = req.query.q
    ;

  if(undefined === chainId){
    chainId = coreConstant['CHAIN_ID'];
  }
  // create instance of search class
  req.searchInstance = new search(chainId);

  req.q = q;
  req.chainId = chainId

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
router.get('/search', searchMiddleware, function (req, res) {

  req.searchInstance.getParamData(req.q)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        redirect_url: "/chain-id/"+req.chainId +requestResponse,
        result_type: "redirect_url"
      });

      return renderResult(response, res, 'application/json');
    })
    .catch(function (reason) {
      const response = responseHelper.successWithData({
        redirect_url: "/search?q="+reason,
        result_type: "redirect_url"
      });

      return renderResult(response, res, 'application/json');
    });
});


module.exports = router;