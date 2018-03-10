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
  , coreConstant = require(rootPrefix + '/config/core_constants')
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

  // create instance of block class
  req.blockInstance = new block(chainId);

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
router.get("/:blockNumber", blockMiddleware, function (req, res) {

  if(req.blockNumber.startsWith("0x")){

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
    result_type: 'block',
    mCss: ['mBlockDetails.css'],
    mJs: ['mBlockDetails.js'],
    title:'Block Details - ' +req.blockNumber,
    meta:{
      transaction_url: "/chain-id/"+req.chainId+"/block/"+req.blockNumber+"/token-transactions",
      chain_id:req.chainId,
      q:req.blockNumber
    },
    page_meta: {
      title: 'OST VIEW | Block Details - '+req.blockNumber,
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'noindex, nofollow',
      image: 'https://dxwfxs8b4lg24.cloudfront.net/ost-view/images/ost-view-og-image-1.jpg.jpg'
    }
  });

  return renderResult(response, res, req.headers['content-type']);
}

function processBlockError(reason, req, res){
  logger.log(req.originalUrl + ":" + reason);

  return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
}

/**
 * Get paginated transactions for a given block number
 *
 * @name Block Transactions
 *
 * @route {GET} {base_url}/:block_number/transactions
 *
 * @routeparam {Integer} :block_number - number of block need to be fetched
 */
router.get("/:blockNumber/transactions", blockMiddleware, function (req, res) {

  var pageSize = coreConstant.DEFAULT_PAGE_SIZE+1;

  req.blockInstance.getBlockTransactions(req.blockNumber, pageSize, req.pagePayload)
    .then(function (queryResponse) {

      const nextPagePayload = getNextPagePaylaodForBlockTransactions(queryResponse, pageSize),
        prevPagePayload = getPrevPagePaylaodForBlockTransactions(queryResponse, req.pagePayload, pageSize)
        ;

      // For all the pages remove last row if its equal to page size.
      if(queryResponse.length == pageSize){
        queryResponse.pop();
      }


      const response = responseHelper.successWithData({
        block_transactions: queryResponse,
        result_type: "block_transactions",
        layout:'empty',
        meta:{
          next_page_payload :nextPagePayload,
          prev_page_payload :prevPagePayload,

          block_number:req.blockNumber,

          transaction_placeholder_url:"/chain-id/"+req.chainId+"/transaction/{{tr_hash}}",
          address_placeholder_url:"/chain-id/"+req.chainId+"/address/{{addr}}"
        }
      });
      return renderResult(response, res,'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
    });
});


function getNextPagePaylaodForBlockTransactions (requestResponse, pageSize){

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

function getPrevPagePaylaodForBlockTransactions (requestResponse, pagePayload, pageSize){

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


/**
 * Get paginated token transactions for a given block number
 *
 * @name Block Token Transactions
 *
 * @route {GET} {base_url}/:block_number/token-transactions
 *
 * @routeparam {Integer} :block_number - number of block need to be fetched
 */
router.get("/:blockNumber/token-transactions", blockMiddleware, function (req, res) {

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