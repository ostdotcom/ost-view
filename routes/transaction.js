"use strict";
/**
 * Transaction related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/transaction</b>
 *
 * @module Explorer Routes - Transaction
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
const renderResult = function (requestResponse, responseObject) {
  return requestResponse.renderResponse(responseObject);
};

// define parameters from url, generate web rpc instance and database connect
const transactionMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , hash = req.params.hash
    , page = req.params.page
  ;

  // create instance of transaction class
  req.transactionInstance = new transaction(chainId);

  req.hash = hash;
  req.page = page;

  next();
};

/**
 * Get details of a given transaction hash
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/:hash
 *
 * @routeparam {String} :hash - Transaction hash (66 chars length)
 */
router.get("/:hash", transactionMiddleware, function (req, res) {

  req.transactionInstance.getTransaction(req.hash)
    .then(function (requestResponse) {

      const response = responseHelper.successWithData({
        transaction: requestResponse,
        result_type: "transaction"
      });

      return renderResult(response, res);
    })
    .catch(function (reason) {
      logger.log("****** transaction: /:hash ***** catch ***** " + reason);
      return renderResult(responseHelper.error('', reason), res);
    });
});

/**
 * Get internal transaction of a given transaction hash
 *
 * @name Internal Transactions
 *
 * @route {GET} {base_url}/:hash/internal-transactions/:page
 *
 * @routeparam {String} :hash - Transaction hash (66 chars length)
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get("/:hash/internal-transactions/:page", transactionMiddleware, function (req, res) {

  req.transactionInstance.getAddressTransactions(req.hash, req.page)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        address_transaction: requestResponse,
        result_type: "address_transaction"
      });

      return renderResult(response, res);
    })
    .catch(function (reason) {
      logger.log("****** transaction: /:hash/internal-transactions/:page ***** catch ***** " + reason);
      return renderResult(responseHelper.error('', reason), res);
    });
});

module.exports = router;