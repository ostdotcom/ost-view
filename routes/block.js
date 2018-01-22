"use strict";
/**
 * Block related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/block</b>
 *
 * @module Explorer Routes - Block
 */
const express = require('express');

// Express router to mount block related routes
const router = express.Router({mergeParams: true});

// load all internal dependencies
const rootPrefix = ".."
  , block = require(rootPrefix + '/models/block')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

// Render final response
const renderResult = function (requestResponse, responseObject) {
  return requestResponse.renderResponse(responseObject);
};

// define parameters from url, generate web rpc instance and database connect
const blockMiddleware = function (req, res, next) {
  const blockNumber = req.params.block_number
    , chainId = req.params.chainId
    , page = req.params.page;

  // create instance of block class
  req.blockInstance = new block(chainId);

  req.blockNumber = blockNumber;
  req.chainId = chainId;
  req.page = page;

  next();
};

/**
 * Get block details for a given block number
 *
 * @name Block Details
 *
 * @route {GET} {base_url}/:block_number
 *
 * @routeparam {Integer} :block_number - number of block need to be fetched
 */
router.get("/:block_number", blockMiddleware, function (req, res) {

  req.blockInstance.getBlock(req.blockNumber)
    .then(function (requestResponse) {

      const response = responseHelper.successWithData({
        block: requestResponse,
        result_type: 'block'
      });

      return renderResult(response, res);
    })
    .catch(function (reason) {
      logger.log("****** block: /:block_number ***** catch ***** " + reason);

      return renderResult(responseHelper.error('', reason), res);
    });
});

/**
 * Get paginated transactions for a given block number
 *
 * @name Block Transactions
 *
 * @route {GET} {base_url}/:block_number/transactions/:page
 *
 * @routeparam {Integer} :block_number - number of block need to be fetched
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get("/:block_number/transactions/:page", blockMiddleware, function (req, res) {

  req.blockInstance.getBlockTransactions(req.blockNumber, req.page)
    .then(function (requestResponse) {

      const response = responseHelper.successWithData({
        transactions: requestResponse,
        result_type: "transactions"
      });

      return renderResult(response, res);
    })
    .catch(function (reason) {
      logger.log("****** block: /:address/transactions/:page ***** catch ***** " + reason);
      return renderResult(responseHelper.error('', reason), res);
    });
});


module.exports = router;