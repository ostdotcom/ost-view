/**
 * Created by Aniket on 26/02/18.
 */
"use strict";
/**
 * Token details related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/tokendetails</b>
 *
 * @module Explorer Routes - Token Details
 */
const express = require('express');

// Express router to mount contract related routes
const router = express.Router({mergeParams: true});

// load all internal dependencies
const rootPrefix = ".."
  , contract = require(rootPrefix + '/models/contract')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConfig = require(rootPrefix + '/config')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  ;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};

// define parameters from url, generate web rpc instance and database connect
const contractMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    ,pageNumber = req.params.page
    ;

  // Get instance of contract class
  req.contractInstance = new contract(chainId);

  req.chainId = chainId;
  req.pageNumber = pageNumber;

  next();
};


/**
 * Get recent transactions of tokens
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/:hash
 *
 * @routeparam {String} :page - page number
 */
router.get("/transactions/recent/:page", contractMiddleware, function (req, res) {

  req.contractInstance.getRecentTokenTransactions( req.pageNumber)
    .then(function (requestResponse) {

      const response = responseHelper.successWithData({
        token_transactions:requestResponse,
        result_type: "token_transactions",
        meta:{
          chain_id:req.chainId,
          address_placeholder_url:"/chain-id/'+req.chainId+'/address/{{address}}",
          transaction_placeholder_url:"/chain-id/"+req.chainId+"/transaction/{{tr_hash}}",
        },
      });

      return renderResult(response, res, 'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

/**
 * Get recent transactions of tokens
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/:hash
 *
 * @routeparam {String} :page - page number
 */
router.get("/top/:page", contractMiddleware, function (req, res) {

  req.contractInstance.getTopTokens( req.pageNumber)
    .then(function (requestResponse) {

      const response = responseHelper.successWithData({
        token_transactions:requestResponse,
        result_type: "token_transactions",
        meta:{
          chain_id:req.chainId,
          token_details_redirect_url: "/chain-id/"+req.chainId+"/tokendetails/{{contract_addr}}"
        },
      });

      return renderResult(response, res, 'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

module.exports = router;