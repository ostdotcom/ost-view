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
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , routeHelper = require(rootPrefix + '/routes/helper')
;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};

/**
 * Get recent transactions of tokens
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/transactions/recent
 *
 */
router.get("/transactions/recent", function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/home/get_recent_token_transfers');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_tt_1')
    .then(function (requestResponse) {
      if(requestResponse.isSuccess()){
        processRecentTokenTransferResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
      }
    });
});


function processRecentTokenTransferResponse(queryResponse, req, res) {
  const tokenTransfers = queryResponse.token_transfers
    , nextPagePayload = queryResponse.next_page_payload
    , prevPagePayload = queryResponse.prev_page_payload
    , contractAddresses = queryResponse.contract_addresses
  ;

  const response = responseHelper.successWithData({
    meta:{
      next_page_payload :nextPagePayload,
      prev_page_payload :prevPagePayload,

      chain_id:req.params.chainId,
      address_placeholder_url:'/chain-id/'+req.params.chainId+'/address/{{address}}',
      transaction_placeholder_url:"/chain-id/"+req.params.chainId+"/transaction/{{tr_hash}}",
      token_details_redirect_url: "/chain-id/"+req.params.chainId+"/tokendetails/{{contract_addr}}"

    },
    token_transfers: tokenTransfers,
    contract_addresses:contractAddresses,
    result_type: "token_transfers"
  });

  return renderResult(response, res, 'application/json');
}

/**
 * Get recent transactions of tokens
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/top
 *
 */
router.get("/top", function (req, res, next) {


  const getDetailsKlass = require(rootPrefix + '/app/services/home/get_top_tokens');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_tt_2')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        processTopTokensResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
      }
    });
});

function processTopTokensResponse(queryResponse, req, res) {

  const response = responseHelper.successWithData({
    top_tokens:queryResponse.top_tokens,
    contract_addresses : queryResponse.contract_addresses,
    result_type: "top_tokens",
    meta:{

      next_page_payload : queryResponse.next_page_payload,
      prev_page_payload : queryResponse.prev_page_payload,

      chain_id:req.params.chainId,
      token_details_redirect_url: "/chain-id/"+req.params.chainId+"/tokendetails/{{contract_addr}}"
    },
  });

  return renderResult(response, res, 'application/json');
}

module.exports = router;