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
 * Get details (balance and transactions) of a given address
 *
 * @name Address Details
 *
 * @route {GET} {base_url}/:address
 *
 * @routeparam {String} :address - Address whose details need to be fetched (42 chars length)
 */
router.get('/:address', function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/address/get_details');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_a_1')
    .then(function (requestResponse) {
      if(requestResponse.isSuccess()){
        processAddressDetailsResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
      }
    });
});

function processAddressDetailsResponse( response, req, res ) {
  const addressDetails = (response=== undefined || response.address_details === undefined) ? '' : response.address_details
    , contractAddresses = (response=== undefined || response.contract_addresses === undefined) ? '' : response.contract_addresses
  ;



  const responseData = responseHelper.successWithData({
    address_info: addressDetails,
    contract_addresses:contractAddresses,
    mCss: ['mAddressDetails.css'],
    mJs: ['mAddressDetails.js'],
    meta: {
      q: req.params.address,
      address:req.params.address,
      transaction_url: '/chain-id/'+req.params.chainId+'/address/'+req.params.address+'/token-transfers'
    },
    page_meta: {
      title: 'OST VIEW | Address Details - '+req.params.address,
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'noindex, nofollow',
      image: 'https://dxwfxs8b4lg24.cloudfront.net/ost-view/images/ost-view-og-image-1.jpg'
    },
    result_type: 'address_details',
    title: 'Address Details - '+req.params.address,
  });

  return renderResult(responseData, res, req.headers['content-type']);
}

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
router.get('/:address/token-transfers', function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/address/token_transfers');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_a_2')
    .then(function (requestResponse) {
      if(requestResponse.isSuccess()){
        processTokenTransferResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');

      }
    });
});

function processTokenTransferResponse(queryResponse, req, res) {
  const tokenTransactions =  queryResponse.tokenTransfers,
    contractAddress = queryResponse.contractAddresses,
    nextPagePayload = queryResponse.next_page_payload,
    prevPagePayload = queryResponse.prev_page_payload
  ;

  // For all the pages remove last row if its equal to page size.


  const response = responseHelper.successWithData({
    transactions: tokenTransactions,
    contract_addresses: contractAddress,
    result_type: "transactions",
    meta:{
      next_page_payload :nextPagePayload,
      prev_page_payload :prevPagePayload,

      transaction_placeholder_url:"/chain-id/"+req.params.chainId+"/transaction/{{tr_hash}}",
      address_placeholder_url:"/chain-id/"+req.params.chainId+"/address/{{addr}}",
      token_details_redirect_url: "/chain-id/"+req.params.chainId+"/tokendetails/{{contract_addr}}",
      q:req.params.address
    }
  });

  return renderResult(response, res, 'application/json');
}


module.exports = router;