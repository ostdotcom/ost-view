"use strict";
/**
 * Transactions related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/transactions</b>
 *
 * @module Explorer Routes - Transactions
 */
const express = require('express');

// Express router to mount search related routes
const router = express.Router({mergeParams: true});

// load all internal dependencies
const rootPrefix = ".."
  , transaction = require(rootPrefix + '/models/transaction')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConfig = require(rootPrefix + '/config')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};


// define parameters from url, generate web rpc instance and database connect
const transactionsMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , page = req.params.page
  ;

  // create instance of transactions class
  req.transactionsInstance = new transaction(chainId);

  req.page = page;

  next();
};

/**
 * Get recent transactions
 *
 * @name Recent Transactions
 *
 * @route {GET} {base_url}/recent/:page
 *
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get("/recent/:page", transactionsMiddleware, function (req, res) {

  req.transactionsInstance.getRecentTransactions(req.page)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        recent_transactions: requestResponse,
        result_type: "recent_transactions"
      });

      return renderResult(response, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
    });
});

/**
 * Get pending transactions
 *
 * @name Pending Transactions
 *
 * @route {GET} {base_url}/pending
 */
router.get("/pending", transactionsMiddleware, function (req, res) {

  req.transactionsInstance.getPendingTransactions()
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        pending_transactions: requestResponse,
        result_type: "pending_transactions"
      });

      return renderResult(response, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
    });
});

module.exports = router;