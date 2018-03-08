"use strict";
/**
 * Specific address related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/address</b>
 *
 * @module Explorer Routes - Address
 */
const express = require('express');

// Express router to mount address related routes
const router = express.Router({mergeParams: true});

// load all internal dependencies
const rootPrefix = ".."
  , address = require(rootPrefix + '/models/address')
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
const addressMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , addressValue = req.params.address
    , contractAddress = req.params.contractAddress
    , nextPagePayload = req.query.next_page_payload
    , prevPagePayload = req.query.prev_page_payload
    ;

  var pagePayload = null;
  if (nextPagePayload){
    pagePayload = nextPagePayload;
  }else if (prevPagePayload){
    pagePayload = prevPagePayload;
  }

  // create instance of address class
  req.addressInstance = new address(chainId);

  req.addressValue = addressValue;
  req.pagePayload = pagePayload;
  req.contractAddress = contractAddress;
  req.chainId = chainId;

  next();
};

/**
 * Get details (balance and transactions) of a given address
 *
 * @name Address Details
 *
 * @route {GET} {base_url}/:address
 *
 * @routeparam {String} :address - Address whose details need to be fetched (42 chars length)
 */
router.get('/:address', addressMiddleware, function (req, res) {

  req.addressInstance.getAddressDetails(req.addressValue)
    .then(function(response){

      const responseData = responseHelper.successWithData({
        address_info: (response.addressDetails === undefined) ? '' : response.addressDetails,
        contract_address:(response.contractAddress === undefined) ? '' : response.contractAddress,
        mCss: ['mAddressDetails.css'],
        mJs: ['mAddressDetails.js'],
        meta: {
          q: req.addressValue,
          address:req.addressValue,
          transaction_url: '/chain-id/'+req.chainId+'/address/'+req.addressValue+'/transactions'
        },
        page_meta: {
          title: 'OST VIEW | Address Details - '+req.addressValue,
          description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
          keywords: 'OST, Simple Token, Utility Chain, Blockchain',
          robots: 'noindex, nofollow',
          image: 'https://dxwfxs8b4lg24.cloudfront.net/ost-view/images/ost-view-meta-data-logo.jpg'
        },
        result_type: 'address_details',
        title: 'Address Details - '+req.addressValue,
      });

      return renderResult(responseData, res, req.headers['content-type']);

    })
    .catch(function (reason){
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });

});

/**
 * Get balance of a given address
 *
 * @name Address Balance
 *
 * @route {GET} {base_url}/:address/balance
 *
 * @routeparam {String} :address - Address whose balance need to be fetched (42 chars length)
 */
router.get('/:address/balance', addressMiddleware, function (req, res) {

  req.addressInstance.getAddressBalance(req.addressValue)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        balance: requestResponse,
        result_type: "balance"
      });

      return renderResult(response, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

/**
 * Get paginated address transactions
 *
 * @name Address Transactions
 *
 * @route {GET} {base_url}/:address/transactions/:page
 *
 * @routeparam {String} :address - Address whose balance need to be fetched (42 chars length)
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get('/:address/transactions', addressMiddleware, function (req, res) {

  var pageSize = coreConstant.DEFAULT_PAGE_SIZE+1;

  req.addressInstance.getAddressTokenTransactions(req.addressValue, pageSize, req.pagePayload)
    .then(function (queryResponse) {

      const tokenTransactions =  queryResponse.tokenTransactions,
        contractAddress = queryResponse.contractAddress,
        nextPagePayload = getNextPagePaylaodForAddressTransactions(tokenTransactions, pageSize),
        prevPagePayload = getPrevPagePaylaodForAddressTransactions(tokenTransactions, req.pagePayload, pageSize)
        ;

      // For all the pages remove last row if its equal to page size.
      if(tokenTransactions.length == pageSize){
        tokenTransactions.pop();
      }

      const response = responseHelper.successWithData({
        transactions: tokenTransactions,
        contract_addresses: contractAddress,
        result_type: "transactions",
        draw : req.query.draw,
        recordsTotal : 120,
        meta:{
          next_page_payload :nextPagePayload,
          prev_page_payload :prevPagePayload,

          transaction_placeholder_url:"/chain-id/"+req.chainId+"/transaction/{{tr_hash}}",
          address_placeholder_url:"/chain-id/"+req.chainId+"/address/{{addr}}",
          q:req.addressValue
        }
      });

      return renderResult(response, res, 'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

function getNextPagePaylaodForAddressTransactions (requestResponse, pageSize){

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

function getPrevPagePaylaodForAddressTransactions (requestResponse, pagePayload, pageSize){

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
 * Get paginated address transactions in given contracts
 *
 * @name Address Contract Transactions
 *
 * @route {GET} {base_url}/:address/contract/:contractAddress/:page
 *
 * @routeparam {String} :address - Address whose balance need to be fetched (42 chars length)
 * @routeparam {String} :contractAddress - Contract address (42 chars length)
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get('/:address/contract/:contractAddress/:page', addressMiddleware, function (req, res) {


  req.addressInstance.getAddressLedgerInContract(req.addressValue, req.contractAddress, req.page)
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