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
  , coreConstant = require(rootPrefix + '/config/core_constants')
;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};

// define parameters from url, generate web rpc instance and database connect
const contractMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , contractAddress = req.params.contractAddress
    , page = req.params.page
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
  req.page = page;
  req.contractAddress = contractAddress;
  req.pagePayload = pagePayload;

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
router.get("/:contractAddress/internal-transactions", contractMiddleware, function (req, res) {

  var pageSize =  coreConstant.DEFAULT_PAGE_SIZE+1;
  +1;

  req.contractInstance.getContractLedger(req.contractAddress, pageSize, req.pagePayload)
    .then(function (queryResponse) {

      const nextPagePayload = getNextPagePaylaodForInternalTransactions(queryResponse, pageSize);
      const prevPagePayload = getPrevPagePaylaodForInternalTransactions(queryResponse, req.pagePayload, pageSize);

      // For all the pages remove last row if its equal to page size.
      if(queryResponse.length == pageSize){
        queryResponse.pop();
      }

      const response = responseHelper.successWithData({
        contract_internal_transactions: queryResponse,
        result_type: "contract_internal_transactions",
        layout : 'empty',
        draw : req.query.draw,
        recordsTotal : 120,
        meta:{
          next_page_payload :nextPagePayload,
          prev_page_payload :prevPagePayload,

          q:req.contractAddress,
          page:req.page,
          transaction_placeholder_url:coreConstant["BASE_URL"]+"/chain-id/"+req.chainId+"/transaction/{{tr_hash}}",
          address_placeholder_url:coreConstant["BASE_URL"]+"/chain-id/"+req.chainId+"/address/{{addr}}"
        }
      });

        logger.log("Request of content-type:", req.headers['content-type']);
      return renderResult(response, res, 'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

function getNextPagePaylaodForInternalTransactions (requestResponse, pageSize){

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

function getPrevPagePaylaodForInternalTransactions (requestResponse, pagePayload, pageSize){

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
 * Get paginated contract transactions by recency
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/:page
 *
 * @routeparam {String} :contractAddress - Contract address whose internal transactions need to be fetched (42 chars length)
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get("/:contractAddress/:page", contractMiddleware, function (req, res) {

  req.contractInstance.getContractTransactions(req.contractAddress, req.page)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        contract_transactions: requestResponse,
        result_type: "contract_transactions"
      });

      return renderResult(response, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

/**
 * Get paginated contract transactions by recency
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/internal-transactions/:page
 *
 * @routeparam {String} :contractAddress - Contract address whose internal transactions need to be fetched (42 chars length)
 */
router.get("/:contractAddress", contractMiddleware, function (req, res) {

  req.contractInstance.getContractTransactions(req.contractAddress)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        contract_transactions: requestResponse,
        result_type: "contract_transactions"
      });

      return renderResult(response, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});


module.exports = router;