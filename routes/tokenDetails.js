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
  , jwtAuth = require(rootPrefix + '/lib/jwt/jwt_auth')
  , customUrlParser = require('url');
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



const assignParams = function (req) {
//  logger.log(customUrlParser.parse(req.originalUrl).pathname, req.method);
  if (req.method == 'POST') {
    req.decodedParams = req.body;
  } else if (req.method == 'GET') {
    req.decodedParams = req.query;
  }
};

// before action for verifying the jwt token and setting the decoded info in req obj
const decodeJwt = function(req, res, next) {

  assignParams(req);

  var token = req.decodedParams.token;

  if(!token){
    return responseHelper.error('401', 'Unauthorized').renderResponse(res, 401);
  }

  // Set the decoded params in the re and call the next in control flow.
  const jwtOnResolve = function (reqParams) {
    req.decodedParams = reqParams.data;
    if (customUrlParser.parse(req.originalUrl).pathname != req.decodedParams['url']){
      return responseHelper.error('a_2', 'Invalid url').renderResponse(res);
    }
    var currentTime = Math.floor((new Date).getTime()/1000);
    if(currentTime > (parseInt(req.decodedParams['request_time']) + 10)){
      return responseHelper.error('a_3', 'Request Expired').renderResponse(res);
    }
    // Validation passed.
    return next();
  };

  // send error, if token is invalid
  const jwtOnReject = function (err) {
    logger.error(err);
    return responseHelper.error('a_1', 'Invalid token or expired').renderResponse(res);
  };

  // Verify token
  Promise.resolve(
    jwtAuth.verifyToken(token, 'saasApi')
      .then(
      jwtOnResolve,
      jwtOnReject
    )
  ).catch(function (err) {
      logger.error(err);
      responseHelper.error('a_2', 'Something went wrong').renderResponse(res)
    });
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
    token_details: {
      coin_name: 'Frenco Coin',
      contract_address: req.contractAddress,
      transaction_url: 'http://localhost:3000/chain-id/' + req.chainId + '/contract/' + req.contractAddress + '/internal-transactions/1'
    },
    result_type: "token_details"
  });
  logger.log("Request of content-type:", req.headers['content-type']);
  renderResult(response, res, req.headers['content-type']);
});

/**
 * Get values and volume of transaction of branded token
 *
 * @name values and volume of number of transactions
 *
 * @route {GET} {base_url}/:contractAddress/graph/numberOfTransactions/:duration
 *
 * @routeparam {String} :contractAddress - Contract address
 * @routeparam {Integer} :duration - previous duration from now.
 */
router.get("/:contractAddress/graph/numberOfTransactions/:duration",decodeJwt, contractMiddleware, function (req, res) {

  req.contractInstance.getValuesAndVolumesOfBrandedTokenTransactions(req.contractAddress, req.duration)
    .then(function (response) {
      const responseData = responseHelper.successWithData({
        result_type: "number_of_transactions",
        number_of_transactions: response,
        meta: {
          duaration: req.duration
        }
      });

      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(responseData, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });
});

/**
 * Get transactions type count of branded token
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/graph/transactionsByType/:duration
 *
 * @routeparam {String} :contractAddress - Contract address
 * @routeparam {Integer} :duration - previous duration from now.
 */
router.get("/:contractAddress/graph/transactionsByType/:duration",decodeJwt, contractMiddleware, function (req, res) {

  req.contractInstance.getGraphDataForBrandedTokenTransactionsByType(req.contractAddress,req.duration)
    .then (function(response){
    const responseData = responseHelper.successWithData({
      result_type: "transaction_type",
      transaction_type: response,
      meta: {
        duaration: req.duration
      }
    });

      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(responseData, res, req.headers['content-type']);
    })
    .catch(function (reason) {
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
router.get("/:contractAddress/topUsers",decodeJwt, contractMiddleware, function (req, res) {

  req.contractInstance.getBrandedTokenTopUsers(req.contractAddress)
    .then(function (response) {
      const responseData = responseHelper.successWithData({
        top_users: response,
        result_type: "top_users",
        meta: {
          user_placeholer_url: "/chain-id/" + req.chainId + "/address/{{address}}"
        }
      });
      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(responseData, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });

});

router.get("/:contractAddress/ostSupply", contractMiddleware, function (req, res) {

  req.contractInstance.getOstSupply(req.contractAddress)
    .then(function (response) {
      const responseData = responseHelper.successWithData({
        ostSupply: response,
        result_type: "ostSupply"
      });
      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(responseData, res, req.headers['content-type']);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res, req.headers['content-type']);
    });

});

module.exports = router;