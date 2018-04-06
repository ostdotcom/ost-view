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
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , routeHelper = require(rootPrefix + '/routes/helper')
;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
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
router.get("/:contractAddress/internal-transactions", function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/token_details/get_token_transfers');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_b_1')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        processTokenTransferResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');      }
    });

});

function  processTokenTransferResponse(queryResponse, req, res) {
  const contractTransactions = queryResponse.token_transfers
    , contractAddresses = queryResponse.contract_addresses
    , nextPagePayload = queryResponse.next_page_payload
    , prevPagePayload = queryResponse.prev_page_payload
  ;

  const response = responseHelper.successWithData({
    contract_internal_transactions: contractTransactions,
    contract_addresses: contractAddresses,
    result_type: "contract_internal_transactions",
    layout : 'empty',
    meta:{
      next_page_payload :nextPagePayload,
      prev_page_payload :prevPagePayload,

      q:req.params.contractAddress,
      transaction_placeholder_url:"/chain-id/"+req.params.chainId+"/transaction/{{tr_hash}}",
      address_placeholder_url:"/chain-id/"+req.params.chainId+"/address/{{addr}}"
    }
  });

  return renderResult(response, res, 'application/json');
}


module.exports = router;