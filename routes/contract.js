"use strict";
/**
 * Contract related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/contract</b>
 *
 * @module Explorer Routes - Contract
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
const renderResult = function (requestResponse, responseObject) {
  return requestResponse.renderResponse(responseObject);
};

// define parameters from url, generate web rpc instance and database connect
const contractMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , contractAddress = req.params.contractAddress
    , page = req.params.page
  ;
  // Get instance of contract class
  req.contractInstance = new contract(chainId);

  req.chainId = chainId;
  req.page = page;
  req.contractAddress = contractAddress;

  next();
};

/**
 * Get paginated contract internal transactions by recency
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/internal-transactions/:page
 *
 * @routeparam {String} :contractAddress - Contract address whose internal transactions need to be fetched (42 chars length)
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get("/:contractAddress/internal-transactions/:page", contractMiddleware, function (req, res) {

  req.contractInstance.getContractLedger(req.contractAddress, req.page)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        contract_transactions: requestResponse,
        result_type: "contract_transactions"
      });

      return renderResult(response, res);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res);
    });
});


module.exports = router;