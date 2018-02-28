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
    , contractAddress = req.params.contractAddress
    , duration = req.params.duration
    , pageNumber = 0;
  ;
  // Get instance of contract class
  req.contractInstance = new contract(chainId);

  req.chainId = chainId;
  req.contractAddress = contractAddress;
  req.duration = duration;
  req.pageNumber = pageNumber

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

  req.contractInstance.getTokenDetails( req.contractAddress )
    .then(function(response){

      const responseData = responseHelper.successWithData({
        token_details : response,
        result_type: "token_details",
        mCss: ['mTokenDetails.css'],
        mJs: ['mTokenDetails.js'],

        meta:{
          transactions_url: '/chain-id/'+req.chainId+'/contract/'+req.contractAddress+'/internal-transactions',
          token_holders_url:'/chain-id/'+req.chainId+'/tokendetails/'+req.contractAddress+'/holders',
          token_transfer_graph_url: "/chain-id/"+req.chainId+"/tokenDetails/"+req.contractAddress+"/graph/numberOfTransactions/",
          token_volume_graph_url: "/chain-id/"+req.chainId+"/tokenDetails/"+req.contractAddress+"/graph/numberOfTransactions/",
          contract_address:req.contractAddress,
          chain_id:req.chainId
        },
        view_data:req.contractInstance.getTokenDetailsInfo(response)
      });
      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(responseData, res, req.headers['content-type']);
    })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    })


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
    renderResult(responseData, res, 'application/json');
  })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });

});


/**
 * Get token holders
 *
 * @name token Holders
 *
 * @route {GET} {base_url}/:contractAddress/holder
 *
 * @routeparam {String} :contractAddress - Contract address
 */
router.get("/:contractAddress/holders", contractMiddleware, function (req, res) {

  req.contractInstance.getTokenHolders( req.contractAddress,  req.pageNumber)
    .then(function(response){
      const responseData = responseHelper.successWithData({
        token_holders : response,
        result_type: "token_holders",
        draw:req.query.draw,
        recordsTotal : 120,
        meta:{
          q:req.contractAddress,
          chainId:req.chainId
        },
      });
      renderResult(responseData, res,'application/json');
    })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    })


});


module.exports = router;