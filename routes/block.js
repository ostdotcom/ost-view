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
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , routeHelper = require(rootPrefix + '/routes/helper')
  ;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};


// define parameters from url, generate web rpc instance and database connect
const blockMiddleware = function (req, res, next) {
  const blockNumber = req.params.blockNumber
    , chainId = req.params.chainId
    , nextPagePayload = req.query.next_page_payload
    , prevPagePayload = req.query.prev_page_payload
    ;

  var pagePayload = null;
  if (nextPagePayload){
    pagePayload = nextPagePayload;
  }else if (prevPagePayload){
    pagePayload = prevPagePayload;
  }

  req.blockNumber = blockNumber;
  req.chainId = chainId;
  req.pagePayload = pagePayload;


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

  var pageSize = coreConstant.DEFAULT_PAGE_SIZE+1;

  req.blockInstance.getBlockTokenTransactions(req.blockNumber, pageSize, req.pagePayload)
    .then(function (queryResponse) {

      var tokenTransactions = queryResponse.tokenTransactions
        , contractAddresses = queryResponse.contractAddresses
      ;

      const nextPagePayload = getNextPagePaylaodForBlockTokenTransactions(tokenTransactions, pageSize),
        prevPagePayload = getPrevPagePaylaodForBlockTokenTransactions(tokenTransactions, req.pagePayload, pageSize)
        ;

      // For all the pages remove last row if its equal to page size.
      if(tokenTransactions.length == pageSize){
        tokenTransactions.pop();
      }

      const response = responseHelper.successWithData({
        block_transactions: tokenTransactions,
        contract_addresses:contractAddresses,
        result_type: "block_transactions",
        layout:'empty',
        meta:{
          next_page_payload :nextPagePayload,
          prev_page_payload :prevPagePayload,

          block_number:req.blockNumber,

          transaction_placeholder_url:"/chain-id/"+req.chainId+"/transaction/{{tr_hash}}",
          address_placeholder_url:"/chain-id/"+req.chainId+"/address/{{addr}}",
          token_details_redirect_url: "/chain-id/"+req.chainId+"/tokendetails/{{contract_addr}}"
        }
      });
      return renderResult(response, res,'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
    });
});


function getNextPagePaylaodForBlockTokenTransactions (requestResponse, pageSize){

  const response = requestResponse,
    count = response.length;

  if(count <= pageSize -1){
    return {};
  }

  return {
    id: response[count-1].id,
    timestamp: response[count-1].timestamp,
    direction: "next"
  };

}

function getPrevPagePaylaodForBlockTokenTransactions (requestResponse, pagePayload, pageSize){

  const response = requestResponse,
    count = response.length;

  // If page payload is null means its a request for 1st page
  // OR direction is previous and count if less than page size means there is no previous page
  if(!pagePayload || (pagePayload.direction === 'prev' && count < pageSize)){
    return {};
  }

  return {
    id: response[0].id,
    timestamp: response[0].timestamp,
    direction: "prev"
  };
}



module.exports = router;