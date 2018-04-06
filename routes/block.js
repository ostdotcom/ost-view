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
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , routeHelper = require(rootPrefix + '/routes/helper')
  ;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
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
router.get("/:blockNumber", function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/block/get_details');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_b_1')
    .then(function (requestResponse) {
      if(requestResponse.isSuccess()){
        processBlockResponse(requestResponse.data, req, res);
      } else {
        processBlockError(requestResponse.err.code, req, res);
      }
    });

});

function processBlockResponse (blockHash, req, res){
  const response = responseHelper.successWithData({
    block: blockHash,
    result_type: 'block',
    mCss: ['mBlockDetails.css'],
    mJs: ['mBlockDetails.js'],
    title:'Block Details - ' +req.params.blockNumber,
    meta:{
      transaction_url: "/chain-id/"+req.params.chainId+"/block/"+req.params.blockNumber+"/token-transfers",
      chain_id:req.params.chainId,
      q:req.params.blockNumber
    },
    page_meta: {
      title: 'OST VIEW | Block Details - '+req.params.blockNumber,
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'noindex, nofollow',
      image: 'https://dxwfxs8b4lg24.cloudfront.net/ost-view/images/ost-view-og-image-1.jpg.jpg'
    }
  });

  return renderResult(response, res, req.headers['content-type']);
}

function processBlockError(errorCode, req, res){
  return renderResult(responseHelper.error(errorCode, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
}


/**
 * Get paginated token transactions for a given block number
 *
 * @name Block Token Transactions
 *
 * @route {GET} {base_url}/:block_number/token-transactions
 *
 * @routeparam {Integer} :block_number - number of block need to be fetched
 */
router.get("/:blockNumber/token-transfers", function (req, res, next) {

  const getBlockTransfersKlass = require(rootPrefix + '/app/services/block/get_token_transfers');

  routeHelper.performer(req, res, next, getBlockTransfersKlass, 'r_b_1')
    .then(function (requestResponse) {
      if(requestResponse.isSuccess()){
        const response = responseHelper.successWithData({
          block_transactions: requestResponse.data.token_transfers,
          contract_addresses:requestResponse.data.contract_addresses,
          result_type: "block_transactions",
          layout:'empty',
          meta:{
            next_page_payload :requestResponse.data.next_page_payload,
            prev_page_payload :requestResponse.data.prev_page_payload,

            block_number:req.params.blockNumber,

            transaction_placeholder_url:"/chain-id/"+req.params.chainId+"/transaction/{{tr_hash}}",
            address_placeholder_url:"/chain-id/"+req.params.chainId+"/address/{{addr}}",
            token_details_redirect_url: "/chain-id/"+req.params.chainId+"/tokendetails/{{contract_addr}}"
          }
        });
        return renderResult(response, res,'application/json');
      } else {
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
      }
    });
});

module.exports = router;