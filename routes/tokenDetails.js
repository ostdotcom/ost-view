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
  , customUrlParser = require('url')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  ;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};


const defaultTopUsersCount = 15;

// define parameters from url, generate web rpc instance and database connect
const contractMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , contractAddress = req.params.contractAddress
    , duration = req.params.duration
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
  req.contractAddress = contractAddress;
  req.duration = duration;
  req.pagePayload = pagePayload

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
          token_transfer_graph_url: "/chain-id/"+req.chainId+"/tokenDetails/"+req.contractAddress+"/graph-date/numberOfTransactions/",
          token_volume_graph_url: "/chain-id/"+req.chainId+"/tokenDetails/"+req.contractAddress+"/graph-date/numberOfTransactions/",
          contract_address:req.contractAddress,
          chain_id:req.chainId
        },
        page_meta: {
          title: 'OST VIEW | '+ response.company_name +' ('+response.company_symbol+') token',
          description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
          keywords: 'OST, Simple Token, Utility Chain, Blockchain',
          robots: 'noindex, nofollow',
          image: 'https://dxwfxs8b4lg24.cloudfront.net/ost-view/images/ost-view-og-image-1.jpg.jpg'
        },
        view_data:{
          summary: req.contractInstance.getTokenDetailsInfo(response),
          graph_stats: req.contractInstance.getTokenStats(response)
        }
      });
      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(responseData, res, req.headers['content-type']);
    })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
    })


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
      if (response !== undefined){
      const responseData = responseHelper.successWithData({
        result_type: "number_of_transactions",
        number_of_transactions: response,
        meta: {
          duaration: req.duration
        }
      });

      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(responseData, res, 'application/json');
    }else{
      return renderResult(responseHelper.error('', 'Data not available. Please check the input parameters.'), res, req.headers['content-type']);
    }

  })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
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

router.get("/:contractAddress/graph-date/numberOfTransactions/:duration", contractMiddleware, function (req, res) {

  req.contractInstance.getTransfersAndVolumesOfBrandedTokenTransactions(req.contractAddress, req.duration)
    .then(function (response) {
      if (response !== undefined){
        const responseData = responseHelper.successWithData({
          result_type: "number_of_transactions",
          number_of_transactions: response,
          meta: {
            duaration: req.duration
          }
        });

        logger.log("Request of content-type:", req.headers['content-type']);
        renderResult(responseData, res, 'application/json');
      }else{
        return renderResult(responseHelper.error('', 'Data not available. Please check the input parameters.'), res, req.headers['content-type']);
      }

    })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
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

  var pageSize = coreConstant.DEFAULT_PAGE_SIZE+1;

  req.contractInstance.getTokenHolders( req.contractAddress, pageSize, req.pagePayload)
    .then(function(queryResponse){

      var tokenHolders = queryResponse.tokenHolders;
      var contractAddress = queryResponse.contractAddress;
      const nextPagePayload = getNextPagePaylaodForHolders(tokenHolders, pageSize);
      const prevPagePayload = getPrevPagePaylaodForHolders(tokenHolders, req.pagePayload, pageSize);

      // For all the pages remove last row if its equal to page size.
      if(tokenHolders.length == pageSize){
        tokenHolders.pop();
      }

      const responseData = responseHelper.successWithData({
        token_holders : tokenHolders,
        contract_address : contractAddress,
        result_type: "token_holders",
        draw : req.query.draw,
        recordsTotal : 120,
        meta:{
          next_page_payload :nextPagePayload,
          prev_page_payload :prevPagePayload,

          q:req.contractAddress,
          chain_id:req.chainId,
          address_placeholder_url : "/chain-id/"+req.chainId+"/address/{{address}}"
        }
      });
      renderResult(responseData, res,'application/json');
    })
    .catch(function(reason){
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
    })
});


function getNextPagePaylaodForHolders (requestResponse, pageSize){

  const response = requestResponse,
    count = response.length;

  if(count <= pageSize -1){
    return {};
  }

  return {
    id: response[count-1].id,
    direction: "next"
  };

}

function getPrevPagePaylaodForHolders (requestResponse, pagePayload, pageSize){

  const response = requestResponse,
    count = response.length;

  // If page payload is null means its a request for 1st page
  // OR direction is previous and count if less than page size means there is no previous page
  if(!pagePayload || (pagePayload.direction === 'prev' && count < pageSize)){
    return {};
  }

  return {
    id: response[0].id,
    direction: "prev"
  };
}

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
      renderResult(responseData, res, 'application/json');
    })
    .catch(function (reason) {
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
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
router.get("/:contractAddress/topUsers", decodeJwt ,contractMiddleware, function (req, res) {

  var topUserCount = req.query.topUserCount;

  if (topUserCount === undefined){
    topUserCount = defaultTopUsersCount;
  }

  req.contractInstance.getBrandedTokenTopUsers(req.contractAddress, topUserCount)
    .then(function (response) {
      const responseData = responseHelper.successWithData({
        top_users: response,
        result_type: "top_users",
        meta: {
          user_placeholer_url: "/chain-id/" + req.chainId + "/address/{{address}}"
        }
      });
      logger.log("Request of content-type:", req.headers['content-type']);
      renderResult(responseData, res, 'application/json');
    })
    .catch(function (reason) {
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
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
      renderResult(responseData, res, 'application/json');
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, 'application/json');
    });

});

module.exports = router;