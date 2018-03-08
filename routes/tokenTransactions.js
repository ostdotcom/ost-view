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
  , contract = require(rootPrefix + '/models/contract')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConfig = require(rootPrefix + '/config')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , constants = require(rootPrefix + '/config/core_constants')
  ;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};

// define parameters from url, generate web rpc instance and database connect
const contractMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , nextPagePayload = req.query.next_page_payload
    , prevPagePayload = req.query.prev_page_payload
  ;

  var pagePayload = null;
  if (nextPagePayload){
    pagePayload = nextPagePayload;
  }else if (prevPagePayload){
    pagePayload = prevPagePayload;
  }
  // Get instance of contract class
  req.contractInstance = new contract(chainId);

  req.chainId = chainId;
  req.pagePayload = pagePayload;

  next();
};


/**
 * Get recent transactions of tokens
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/transactions/recent
 *
 */
router.get("/transactions/recent", contractMiddleware, function (req, res) {
  var pageSize = constants.DEFAULT_PAGE_SIZE+1;

  req.contractInstance.getRecentTokenTransactions( pageSize, req.pagePayload)
    .then(function (queryResponse) {
      const tokenTransactions = queryResponse.tokenTransactions
        , nextPagePayload = getNextPagePaylaodForRecentTransactions(tokenTransactions, pageSize)
        , prevPagePayload = getPrevPagePaylaodForRecentTransactions(tokenTransactions, req.pagePayload, pageSize)
        ;

      // For all the pages remove last row if its equal to page size.
      if(tokenTransactions.length == pageSize){
        tokenTransactions.pop();
      }

      const response = responseHelper.successWithData({
        meta:{
          next_page_payload :nextPagePayload,
          prev_page_payload :prevPagePayload,

          chain_id:req.chainId,
          address_placeholder_url:'/chain-id/'+req.chainId+'/address/{{address}}',
          transaction_placeholder_url:"/chain-id/"+req.chainId+"/transaction/{{tr_hash}}"
        },
        token_transactions:tokenTransactions,
        contract_addresses:queryResponse.contractAddress,
        result_type: "token_transactions"
      });

      return renderResult(response, res, 'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

function getNextPagePaylaodForRecentTransactions (requestResponse, pageSize){

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

function getPrevPagePaylaodForRecentTransactions (requestResponse, pagePayload, pageSize){

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
 * Get recent transactions of tokens
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/top
 *
 */
router.get("/top", contractMiddleware, function (req, res) {
  var pageSize = constants.DEFAULT_PAGE_SIZE+1;

  req.contractInstance.getTopTokens(pageSize, req.pagePayload)
    .then(function (queryResponse) {

      const nextPagePayload = getNextPagePaylaodForTopTokens(queryResponse, pageSize, req.pagePayload);
      const prevPagePayload = getPrevPagePaylaodForTopTokens(queryResponse, req.pagePayload, pageSize);

      // For all the pages remove last row if its equal to page size.
      if(queryResponse.length == pageSize){
        queryResponse.pop();
      }

      const response = responseHelper.successWithData({
        top_tokens:queryResponse,
        result_type: "top_tokens",
        meta:{

          next_page_payload : nextPagePayload,
          prev_page_payload : prevPagePayload,

          chain_id:req.chainId,
          token_details_redirect_url: "/chain-id/"+req.chainId+"/tokendetails/{{contract_addr}}"
        },
      });

      return renderResult(response, res, 'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});


function getNextPagePaylaodForTopTokens (requestResponse, pageSize, pagePayload){

  const response = requestResponse,
    count = response.length;

  if(count <= pageSize -1){
    return {};
  }
  var pageNumber = 0;
  if (pagePayload){
    if (!isNaN(parseInt(pagePayload.page_no))){
      pageNumber = parseInt(pagePayload.page_no) + 1
    }
  }else{
    pageNumber += 2;
  }

  return {
    page_no: pageNumber,
    market_cap:response[count-1].market_cap,
    direction: "next"
  };

}

function getPrevPagePaylaodForTopTokens (requestResponse, pagePayload, pageSize){

  const response = requestResponse,
    count = response.length;

  // If page payload is null means its a request for 1st page
  // OR direction is previous and count if less than page size means there is no previous page
  if(!pagePayload || (pagePayload.direction === 'prev' && count < pageSize)){
    return {};
  }

  var pageNumber = 0;
  if (pagePayload){
    if (!isNaN(parseInt(pagePayload.page_no))){
      pageNumber = parseInt(pagePayload.page_no) - 1
    }
  }else{
    pageNumber += 1;
  }

  return {
    page_no: pageNumber,
    market_cap:response[0].market_cap,
    direction: "prev"
  };
}


module.exports = router;