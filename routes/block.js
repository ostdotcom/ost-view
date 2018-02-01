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
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};


// define parameters from url, generate web rpc instance and database connect
const blockMiddleware = function (req, res, next) {
  const blockNumber = req.params.blockNumber
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
 * @route {GET} {base_url}/:blockNumber
 *
 * @routeparam {Integer} :block_number - number of block need to be fetched
 */
router.get("/:blockNumber", blockMiddleware, function (req, res) {

  if(req.blockNumber.startsWith("0x")){

    console.log("# is hash ::",req.blockNumber);
    req.blockInstance.getBlockFromBlockHash(req.blockNumber)
      .then(function (requestResponse) {
        processBlockResponse(requestResponse, req, res);
      })
      .catch(function (reason) {
        processBlockError(reason, req, res);
      });
  }else{

    console.log("# is number ::",req.blockNumber);
    req.blockInstance.getBlockFromBlockNumber(req.blockNumber)
      .then(function (requestResponse) {
        processBlockResponse(requestResponse, req, res);
      })
      .catch(function (reason) {
        processBlockError(reason, req, res);
      });
  }


});

function processBlockResponse (blockHash, req, res){
  const response = responseHelper.successWithData({
    block: blockHash,
    transaction_url:"http://localhost:3000/chain-id/"+req.chainId+"/block/"+req.blockNumber+"/transactions/1",
    result_type: 'block'
  });

  return renderResult(response, res, req.headers['content-type']);
}

function processBlockError(reason, req, res){
  logger.log(req.originalUrl + ":" + reason);

  return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
}

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
router.get("/:blockNumber/transactions/:page", blockMiddleware, function (req, res) {
  req.blockInstance.getBlockTransactions(req.blockNumber, req.page)
    .then(function (requestResponse) {

      const response = responseHelper.successWithData({
        block_transactions: requestResponse,
        result_type: "block_transactions",
        layout:'empty'
      });
      return renderResult(response, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});


module.exports = router;