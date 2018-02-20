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
;

// Class related constants
const balanceIndex = 0
  , transactionsIndex = 0
  , defaultPageNumber = 1;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};

// define parameters from url, generate web rpc instance and database connect
const addressMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , addressValue = req.params.address
    , page = req.params.page
    , contractAddress = req.params.contractAddress;

  // create instance of address class
  req.addressInstance = new address(chainId);

  req.addressValue = addressValue;
  req.page = page;
  req.contractAddress = contractAddress;

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

  var promiseResolvers = [];

  //promiseResolvers.push(req.addressInstance.getAddressBalance(req.addressValue));
  promiseResolvers.push(req.addressInstance.getAddressTransactions(req.addressValue, defaultPageNumber));

  Promise.all(promiseResolvers).then(function (rsp) {

    //const balanceValue = rsp[balanceIndex];
    const transactionsValue = rsp[transactionsIndex]

    const response = responseHelper.successWithData({
      //balance: balanceValue,
      transactions: transactionsValue,
      address: req.addressValue,
      mCss: ['mAddressDetails.css'],
      mJs: ['mAddressDetails.js'],
      result_type: 'address_details',
      title:'Address Details - '+req.addressValue,
    });

    return renderResult(response, res, req.headers['content-type']);
  })
    .catch(function (reason){

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
router.get('/:address/transactions/:page', addressMiddleware, function (req, res) {


  req.addressInstance.getAddressTransactions(req.addressValue, req.page)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        transactions: requestResponse,
        result_type: "transactions"
      });

      return renderResult(response, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

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