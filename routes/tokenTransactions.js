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
const contractMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , pageNumber = req.query.start/req.query.length
    , nextPagePayload = req.query.next_page_payload
    , prevPagePayload = req.query.prev_page_payload
  ;


  console.log("req.query.next_page_payload :: ",nextPagePayload);
  console.log("req.query.prev_page_payload :: ",prevPagePayload);



  var pagePaylod = {};
  if (nextPagePayload !== undefined && Object.keys(nextPagePayload).length > 0){
    console.log("1..");
    pagePaylod = nextPagePayload;
  }else if (prevPagePayload !== undefined && Object.keys(prevPagePayload).length > 0){
    console.log("2..");

    pagePaylod = prevPagePayload;
  }else{
    console.log("3..");

  }

  // Get instance of contract class
  req.contractInstance = new contract(chainId);

  req.chainId = chainId;
  req.pageNumber = pageNumber;
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

  req.contractInstance.getRecentTokenTransactions( req.pageNumber, req.pagePayload)
    .then(function (requestResponse) {

      const response = responseHelper.successWithData({
        token_transactions:requestResponse.response,
        result_type: "token_transactions",
        draw : req.query.draw,
        recordsTotal : 120,
        meta:{

          next_page_payload : getNextPagePaylaodForRecentTransactions(requestResponse, req.pagePayload),
          prev_page_payload : getPrevPagePaylaodForRecentTransactions(requestResponse, req.pagePayload),

          chain_id:req.chainId,
          address_placeholder_url:'/chain-id/'+req.chainId+'/address/{{address}}',
          transaction_placeholder_url:"/chain-id/"+req.chainId+"/transaction/{{tr_hash}}",
        },
      });
      return renderResult(response, res, 'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

function getNextPagePaylaodForRecentTransactions (requestResponse, pagePayload){

  const pageSize = requestResponse.pageSize;
  const response = requestResponse.response;


  if(pageSize < response.length){

    console.log("--> getNextPagePaylaodForRecentTransactions :: 1 ::",response[response.length-1].timestamp);
    console.log("getNextPagePaylaodForRecentTransactions :: 2 ::",response[0].timestamp);

    return {
      timestamp:response[response.length-1].timestamp,
      direction: "next"
    };
  }else{
    console.log("getNextPagePaylaodForRecentTransactions empty");

    return {};
  }
}

function getPrevPagePaylaodForRecentTransactions (requestResponse, pagePayload){

  const pageSize = requestResponse.pageSize;
  const response = requestResponse.response;

  console.log("pagePayload :: ",pagePayload, Object.keys(pagePayload).length > 0);
  if(Object.keys(pagePayload).length > 0){
    console.log("getPrevPagePaylaodForRecentTransactions :: 1 ::",response[response.length-1].timestamp);
    console.log("--> getPrevPagePaylaodForRecentTransactions :: 2 ::",response[0].timestamp);
    return {
      timestamp:response[0].timestamp,
      direction: "prev"
    }
  }else{
    console.log("getPrevPagePaylaodForRecentTransactions empty");

    return {};
  }
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
        draw : req.query.draw,
        recordsTotal : 3,
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

  if(Object.keys(pagePayload).length > 0){

    return {
      market_cap:response[0].market_cap,
      direction: "prev"

    };
  }else{

    return {};
  }
}

module.exports = router;