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
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConfig = require(rootPrefix + '/config')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , jwtAuth = require(rootPrefix + '/lib/jwt/jwt_auth')
  , customUrlParser = require('url')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , routeHelper = require(rootPrefix + '/routes/helper')
;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
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
router.get("/:contractAddress", function (req, res, next) {


  const getDetailsKlass = require(rootPrefix + '/app/services/token_details/get_details');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_td_1')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        processTokenDetailsResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
      }
    });

});

function processTokenDetailsResponse(response, req, res) {
  console.log("token_details : ",response.token_details);
  const responseData = responseHelper.successWithData({
    token_details : response.token_details,
    result_type: "token_details",
    mCss: ['mTokenDetails.css'],
    mJs: ['mTokenDetails.js'],
    meta:{
      transactions_url: '/chain-id/'+req.params.chainId+'/contract/'+req.params.contractAddress+'/internal-transactions',
      token_holders_url:'/chain-id/'+req.params.chainId+'/tokendetails/'+req.params.contractAddress+'/holders',
      token_transfer_graph_url: "/chain-id/"+req.params.chainId+"/tokenDetails/"+req.params.contractAddress+"/graph-date/numberOfTransactions/",
      token_volume_graph_url: "/chain-id/"+req.params.chainId+"/tokenDetails/"+req.params.contractAddress+"/graph-date/numberOfTransactions/",
      contract_address:req.params.contractAddress,
      chain_id:req.params.chainId,
      sub_environment: coreConstant['VIEW_SUB_ENVIRONMENT']
    },
    page_meta: {
      title: 'OST VIEW | '+response.token_details.company_name +' ('+response.token_details.company_symbol+') token',
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'noindex, nofollow',
      image: 'https://dxwfxs8b4lg24.cloudfront.net/ost-view/images/ost-view-og-image-1.jpg.jpg'
    },
    view_data:{
      summary: response.token_info,
      graph_stats: response.token_stats
    },
    constants:{
      cloud_front_base_domain: coreConstant.CLOUD_FRONT_BASE_DOMAIN
    }
  });

  renderResult(responseData, res, req.headers['content-type']);
}


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

router.get("/:contractAddress/graph/numberOfTransactions/:duration",decodeJwt, function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/token_details/get_token_transfer_graph_data');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_td_g_nt_1')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        const responseData = responseHelper.successWithData({
          result_type: "number_transactions",
          number_transactions: requestResponse.data.graph_data,
          meta: {
            duration: req.params.duration
          }
        });

        renderResult(responseData, res, 'application/json');
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
      }
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
router.get("/:contractAddress/graph/transactionsByType/:duration",decodeJwt, function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/token_details/get_transaction_by_type');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_td_g_tbt_1')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        const responseData = responseHelper.successWithData({
          result_type: "transaction_type",
          transaction_type: requestResponse.data.graph_data,
          meta: {
            duaration: req.duration
          }
        });

        renderResult(responseData, res, 'application/json');
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
      }
    });
});


/**
 * Get values and volume of transaction of branded token
 *
 * @name values and volume of number of transactions
 *
 * @route {GET} {base_url}/:contractAddress/graph-date/numberOfTransactions/:duration
 *
 * @routeparam {String} :contractAddress - Contract address
 * @routeparam {Integer} :duration - previous duration from now.
 */

router.get("/:contractAddress/graph-date/numberOfTransactions/:duration", function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/token_details/get_token_transfer_graph_data');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_td_g_nt_2')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        const responseData = responseHelper.successWithData({
          result_type: "number_transactions",
          number_transactions : requestResponse.data.graph_data,
          meta: {
            duration: req.params.duration
          }
        });

        renderResult(responseData, res, 'application/json');
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
      }
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
router.get("/:contractAddress/holders", function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/token_details/get_token_holders');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_td_1')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        processTokenHoldersResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
      }
    });
});


function processTokenHoldersResponse(queryResponse, req, res) {

  var tokenHolders = queryResponse.holders
    , contractAddresses = queryResponse.contract_addresses
    , nextPagePayload = queryResponse.next_page_payload
    , prevPagePayload = queryResponse.prev_page_payload
  ;

  const responseData = responseHelper.successWithData({
    token_holders : tokenHolders,
    contract_addresses : contractAddresses,
    result_type: "token_holders",

    meta:{
      next_page_payload :nextPagePayload,
      prev_page_payload :prevPagePayload,

      q:req.params.contractAddress,
      chain_id:req.params.chainId,
      address_placeholder_url : "/chain-id/"+req.params.chainId+"/address/{{address}}"
    }
  });

  return renderResult(responseData, res,'application/json');
}

/**
 * Get top users of branded token
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/topUsers
 *
 * @routeparam {String} :contractAddress - Contract address
 */
router.get("/:contractAddress/topUsers",decodeJwt, function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/token_details/get_top_users');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_td_tu_1')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        processTopUsersResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
      }
    });
});

function processTopUsersResponse(response, req, res) {
  const responseData = responseHelper.successWithData({
    top_users: response.top_users,
    result_type: "top_users",
    meta: {
      user_placeholer_url: "/chain-id/" + req.params.chainId + "/address/{{address}}"
    }
  });

  console.log("processTopUsersResponse : ",responseData);
  renderResult(responseData, res, 'application/json');
}

module.exports = router;