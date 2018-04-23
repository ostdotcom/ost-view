"use strict";
/**
 * Index route.<br><br>
 * Base url for all routes given below is: <b>base_url = /</b>
 *
 * @module Explorer Routes - Index
 */
const express = require('express');

// Express router to mount search related routes
const router = express.Router({mergeParams: true});

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
 * Index route
 *
 * @name Index route
 *
 * @route {GET} {base_url}
 *
 */
router.get("/", function(req, res, next){
  fetchHomeData(req, res, next);
});


/**
 * Index route
 *
 * @name Index route
 *
 * @route {GET} {base_url}
 *
 */
router.get("/home", function(req, res, next){
    fetchHomeData(req, res, next);
});


function fetchHomeData (req, res, next) {


  const getDetailsKlass = require(rootPrefix + '/app/services/home/get_details');

  return routeHelper.performer(req, res, next, getDetailsKlass, 'r_a_2')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        processHomeDetailsResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + " : " + requestResponse.err.code);
        return renderResult(responseHelper.error(requestResponse.err.code, coreConstant.DEFAULT_DATA_NOT_AVAILABLE_TEXT), res, req.headers['content-type']);
      }
    });
}

function processHomeDetailsResponse(requestResponse, req, res) {

  var chainId = req.params.chainId
    , baseContractAddress = coreConstant['BASE_CONTRACT_ADDRESS'];
  ;


  if (!chainId || chainId === undefined){
    chainId = coreConstant.DEFAULT_CHAIN_ID;
  }

  const response = responseHelper.successWithData({
    home: requestResponse.home_data,
    result_type: "home",
    title: "OST View - OST SideChains Explorer and Search",
    mCss:['mHome.css'],
    mJs:['mHome.js'],
    view_data: {
      "summary":requestResponse.chain_info,
      "graph_stats": requestResponse.chain_stats
    },
    meta:{
      "chain_id" : chainId,
      "contract_address" : coreConstant['BASE_CONTRACT_ADDRESS'],
      "top_tokens_url" : "/chain-id/"+chainId+"/tokens/top",
      "latest_token_transfer_url" : "/chain-id/"+chainId+"/tokens/transactions/recent",
      "token_transfer_graph_url" : "/chain-id/"+chainId+"/tokenDetails/"+baseContractAddress+"/graph-date/numberOfTransactions/",
      "token_volume_graph_url" : "/chain-id/"+chainId+"/tokenDetails/"+baseContractAddress+"/graph-date/numberOfTransactions/"
    },
    page_meta: {
      title: 'OST VIEW - Block Explorer for OpenST Utility Blockchains',
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'index, follow',
      image: 'https://'+coreConstant.CLOUD_FRONT_BASE_DOMAIN+'/ost-view/images/ost-view-og-image-1.jpg.jpg',
    },
    constants:{
      cloud_front_base_domain: coreConstant.CLOUD_FRONT_BASE_DOMAIN
    }
  });

  return renderResult(response, res, req.headers['content-type']);
}

/**
 * Search by address, contract address, transaction hash, block number
 *
 * @name Search
 *
 * @route {GET} {base_url}/:param
 *
 * @routeparam {String} :params - search string
 */
router.get('/search', function (req, res, next) {

  const getDetailsKlass = require(rootPrefix + '/app/services/search/get_url');

  routeHelper.performer(req, res, next, getDetailsKlass, 'r_i_s_1')
    .then(function (requestResponse) {
      if (requestResponse.isSuccess()) {
        const response = responseHelper.successWithData({
          redirect_url: "/chain-id/"+coreConstant.DEFAULT_CHAIN_ID +requestResponse.data,
          result_type: "redirect_url"
        });

        return renderResult(response, res, 'application/json');
      } else {
        const response = responseHelper.successWithData({
          redirect_url: "/search-results?q="+req.query.q,
          result_type: "redirect_url"
        });

        return renderResult(response, res, 'application/json');
      }
    });
});


module.exports = router;