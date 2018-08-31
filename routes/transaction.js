"use strict";
/**
 * Transaction related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/transaction</b>
 *
 * @module Explorer Routes - Transaction
 */
const express = require('express');

// Express router to mount search related routes
const router = express.Router({mergeParams: true});

// load all internal dependencies
const rootPrefix = ".."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConfig = require(rootPrefix + '/config')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , routeHelper = require(rootPrefix + '/routes/helper')
;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};


// define parameters from url, generate web rpc instance and database connect
const transactionMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , hash = req.params.hash
    , page = req.params.page
  ;

  // create instance of transaction class
  req.transactionInstance = new transaction(chainId);

  req.hash = hash;
  req.page = page;
  req.chainId = chainId;

  next();
};

/**
 * Get details of a given transaction hash
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/:hash
 *
 * @routeparam {String} :hash - Transaction hash (66 chars length)
 */
router.get("/:transactionHash", function (req, res, next) {


  const getDetailsKlass = require(rootPrefix + '/app/services/transaction/get_details');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_t_1')
    .then(function (requestResponse) {
      if(requestResponse.isSuccess()){
        processTransactionResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);

      }
    });
});


function processTransactionResponse(requestResponse, req, res){

  const response = responseHelper.successWithData({
    transaction: requestResponse['transaction_details'],
    token_transfer_details:requestResponse['token_transfer_details'],
    contract_addresses: requestResponse['contract_addresses'],
    result_type: "transaction",
    meta:{
      q:req.params.transactionHash,
      chain_id:req.params.chainId,
      redirect_url:{
        address_placeholder_url: '/chain-id/'+req.params.chainId+'/address/',
        block_placeholder_url: '/chain-id/'+req.params.chainId+'/block/',
        token_details_redirect_url: '/chain-id/'+req.params.chainId+'/tokendetails/',
      },
      sub_environment: coreConstant['VIEW_SUB_ENVIRONMENT']
    },
    page_meta: {
      title: 'OST VIEW | Tx Details - '+req.params.transactionHash,
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'noindex, nofollow',
      image: 'https://dxwfxs8b4lg24.cloudfront.net/ost-view/images/ost-view-og-image-1.jpg.jpg'
    },
    mCss: ['mTransactionDetails.css'],
    mJs: [],
    title:'Transaction Details - '+ req.hash,
    constants:{
      cloud_front_base_domain: coreConstant.CLOUD_FRONT_BASE_DOMAIN
    }
  });

  return renderResult(response, res, req.headers['content-type']);
}

/**
 * Get internal transaction of a given transaction hash
 *
 * @name Internal Transactions
 *
 * @route {GET} {base_url}/:hash/internal-transactions/:page
 *
 * @routeparam {String} :hash - Transaction hash (66 chars length)
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get("/:hash/internal-transactions/:page", transactionMiddleware, function (req, res) {

  req.transactionInstance.getAddressTransactions(req.hash, req.page)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        address_transaction: requestResponse,
        result_type: "address_transaction"
      });

      return renderResult(response, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
    });
});

module.exports = router;