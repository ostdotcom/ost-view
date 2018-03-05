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
  ;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};

// define parameters from url, generate web rpc instance and database connect
const contractMiddleware = function (req, rresponsees, next) {
  const chainId = req.params.chainId
    , nextPagePayload = req.query.next_page_payload
    , prevPagePayload = req.query.prev_page_payload
  ;

  var pagePaylod = null;
  if (nextPagePayload){
    console.log("\n\n\n************* nextPagePayload :: ", nextPagePayload);
    pagePaylod = nextPagePayload;
  }else if (prevPagePayload){
    console.log("\n\n\n************* prevPagePayload :: ", prevPagePayload);
    pagePaylod = prevPagePayload;
  }
  // Get instance of contract class
  req.contractInstance = new contract(chainId);

  req.chainId = chainId;
  req.pagePayload = pagePaylod;

  next();
};


/**
 * Get recent transactions of tokens
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/:hash
 *
 * @routeparam {String} :page - page number
 */
router.get("/transactions/recent", contractMiddleware, function (req, res) {
  var pageSize = 3+1;

  req.contractInstance.getRecentTokenTransactions( pageSize, req.pagePayload)
    .then(function (queryResponse) {

      const nextPagePayload = getNextPagePaylaodForRecentTransactions(queryResponse, pageSize);
      var prevPagePayload = {};

      const responseData = queryResponse;
      // For all the pages remove last row if its equal to page size.
      var lastRecordRemoved = false;
      if(queryResponse.length == pageSize){
        queryResponse.pop();
        lastRecordRemoved = true;
      }else if(req.pagePayload.direction === 'next'){
        lastRecordRemoved = true;
      }

      if(req.pagePayload && req.pagePayload.direction === 'prev'){
        queryResponse.reverse();
      }
      if(lastRecordRemoved){
        prevPagePayload = getPrevPagePaylaodForRecentTransactions(queryResponse, req.pagePayload, pageSize);
      }
      const response = responseHelper.successWithData({
        draw : req.query.draw,
        recordsTotal : 120,
        meta:{
          next_page_payload :nextPagePayload,
          prev_page_payload :prevPagePayload,

          chain_id:req.chainId,
          address_placeholder_url:'/chain-id/'+req.chainId+'/address/{{address}}',
          transaction_placeholder_url:"/chain-id/"+req.chainId+"/transaction/{{tr_hash}}"
        },
        token_transactions:queryResponse,
        result_type: "token_transactions",
      });

      return renderResult(response, res, 'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});


function getResponseData (requestResponse, isFirstPageRequest){
  const pageSize = requestResponse.pageSize;
  const response = requestResponse.response;

  if (pageSize < response.length)
  {

    return response;
  }

  return response;
}

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
  if(!pagePayload){
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
 * @route {GET} {base_url}/:hash
 *
 * @routeparam {String} :page - page number
 */
router.get("/top", contractMiddleware, function (req, res) {

  req.contractInstance.getTopTokens( req.pageNumber, req.pagePayload)
    .then(function (requestResponse) {

      const response = responseHelper.successWithData({
        token_transactions:requestResponse.response,
        result_type: "token_transactions",
        meta:{

          next_page_payload : getNextPagePaylaodForTopTokens(requestResponse, req.pagePayload),
          prev_page_payload : getPrevPagePaylaodForTopTokens(requestResponse, req.pagePayload),

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


function getNextPagePaylaodForTopTokens (requestResponse, pagePayload){
  const pageSize = requestResponse.pageSize;
  const response = requestResponse.response;

  if(pageSize < response.length){

    return {
      market_cap:response[response.length-1].market_cap,
      direction: "next"

    };
  }else{

    return {};
  }
}

function getPrevPagePaylaodForTopTokens (requestResponse, pagePayload){

  const pageSize = requestResponse.pageSize;
  const response = requestResponse.response;

  if(pagePayload && Object.keys(pagePayload).length > 0){

    return {
      market_cap:response[0].market_cap,
      direction: "prev"

    };
  }else{

    return {};
  }
}

module.exports = router;