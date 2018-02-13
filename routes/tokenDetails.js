"use strict";
/**
 * Token details related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/tokenDetails</b>
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
    , contractAddress = req.params.contractAddress
    , duration = req.params.duration
  ;
  // Get instance of contract class
  req.contractInstance = new contract(chainId);

  req.chainId = chainId;
  req.contractAddress = contractAddress;
  req.duration = duration;

  next();
};

/**
 * Get contract details
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/internal-transactions/:page
 *
 * @routeparam {String} :contractAddress - Contract address whose internal transactions need to be fetched (42 chars length)
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get("/:contractAddress", contractMiddleware, function (req, res) {
  
  const response = responseHelper.successWithData({
        token_details : { coin_name: 'Frenco Coin',
          contract_address: req.contractAddress,
          transaction_url:'http://localhost:3000/chain-id/'+req.chainId+'/contract/'+req.contractAddress+'/internal-transactions/1'
        },
        result_type: "token_details"
      });
      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(response, res, req.headers['content-type']);
});

/**
 * Get values and number of transaction of branded token
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/graph/numberOfTransactions/:duration
 *
 * @routeparam {String} :contractAddress - Contract address
 * @routeparam {Integer} :duration - previous duration from now.
 */
router.get("/:contractAddress/graph/numberOfTransactions/:duration", contractMiddleware, function (req, res) {

    req.contractInstance.getGraphDataOfNumberOfBrandedTokenTransactions(req.contractAddress,req.duration)
    .then (function(response){
    const responseData = responseHelper.successWithData({
      result_type: "number_of_transactions",
      number_of_transactions :response,
      meta:{
        duaration:req.duration
      }
    });
    logger.log("Request of content-type:", req.headers['content-type']);
    renderResult(responseData, res, req.headers['content-type']);
  })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });

});

/**
 * Get transactions count for type of branded token
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/graph/transactionsByType/:duration
 *
 * @routeparam {String} :contractAddress - Contract address
 * @routeparam {Integer} :duration - previous duration from now.
 */
router.get("/:contractAddress/graph/transactionsByType/:duration", contractMiddleware, function (req, res) {

  req.contractInstance.getGraphDataForBrandedTokenTransactionsByType(req.contractAddress,req.duration)
    .then (function(response){
    const responseData = responseHelper.successWithData({
      result_type: "transaction_type",
      transaction_type :response

    });
    logger.log("Request of content-type:", req.headers['content-type']);
    renderResult(responseData, res, req.headers['content-type']);
  })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });

});

/**
 * Get top users of branded token
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/topUsers
 *
 * @routeparam {String} :contractAddress - Contract address
 */
router.get("/:contractAddress/topUsers", contractMiddleware, function (req, res) {

  req.contractInstance.getBrandedTokenTopUsers(req.contractAddress)
    .then (function(response) {
      const responseData = responseHelper.successWithData({
        top_users :response,
        result_type: "top_users",
        meta :{
          user_url_templete:"/chain-id/"+req.chainId+"/address/{{address}}"
        }
      });
      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(responseData, res, req.headers['content-type']);
    })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });

});

router.get("/:contractAddress/ostSupply", contractMiddleware, function (req, res) {

  req.contractInstance.getOstSupply(contractAddress)
    .then (function(response){
    const responseData = responseHelper.successWithData({
      ostSupply :response,
      result_type: "ostSupply"
    });
    logger.log("Request of content-type:", req.headers['content-type']);
    renderResult(responseData, res, req.headers['content-type']);
  })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });

});

module.exports = router;