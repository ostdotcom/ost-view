'use strict';
/**
 * Block related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/block</b>
 *
 * @module Explorer Routes - Block
 */
const express = require('express');

// Express router to mount block related routes
const router = express.Router({ mergeParams: true });

// load all internal dependencies
const rootPrefix = '..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  baseRoutes = require(rootPrefix + '/lib/globalConstant/baseRoutes'),
  routeHelper = require(rootPrefix + '/routes/helper');

// Render final response
const renderResult = function(requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, requestResponse.isSuccess() ? 200 : 500, contentType);
};

/**
 * Get block details for a given block number
 *
 * @name Block Details
 *
 * @route {GET} {base_url}/:blockNumber
 *
 * @routeparam {Integer} :block_number - number of block need to be fetched
 */
router.get('/bk-:chainId-:blockNumber', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/block/GetDetails');

  routeHelper.performer(req, res, next, 'GetBlockDetails', 'r_b_1').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processBlockResponse(requestResponse.data, req, res);
    } else {
      processBlockError(requestResponse.err.code, req, res);
    }
  });
});

function processBlockResponse(response, req, res) {
  let blockDetails = response,
    urlTemplates = baseRoutes.getAllUrls();

  let rawResponse = {
    block: blockDetails,
    meta: {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      urlTemplates: urlTemplates
    }
  };

  let webViewResponse = {
    page_meta: {
      title: `OST VIEW | Block Details - ${blockDetails.blockNumber}`,
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'noindex, nofollow',
      image: `${coreConstants.CLOUD_FRONT_BASE_DOMAIN}/ost-view/images/ost-view-og-image-1.jpg`
    },
    mCss: ['mBlockDetails.css'],
    mJs: ['mBlockDetails.js'],
    title: `Block Details - ${blockDetails.blockNumber}`,
    constants: {
      cloud_front_base_domain: coreConstants.CLOUD_FRONT_BASE_DOMAIN
    },
    template: coreConstants.block
  };

  if (req.headers['content-type'] != 'application/json') {
    Object.assign(rawResponse, webViewResponse);
  }

  return renderResult(responseHelper.successWithData(rawResponse), res, req.headers['content-type']);
}

function processBlockError(errorCode, req, res) {
  return renderResult(
    responseHelper.error(errorCode, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
    res,
    req.headers['content-type']
  );
}

/**
 * Get paginated token transactions for a given block number
 *
 * @name Block Token Transactions
 *
 * @route {GET} {base_url}/:block_number/token-transactions
 *
 * @routeparam {Integer} :block_number - number of block need to be fetched
 */
router.get('/bk-:chainId-:blockNumber/transactions', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/block/Transactions');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  routeHelper.performer(req, res, next, 'BlockTransactions', 'r_b_1').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      const response = responseHelper.successWithData({
        transactions: requestResponse.data.transactions,
        layout: 'empty',
        meta: {
          nextPagePayload: requestResponse.data.nextPagePayload
        },
        template: coreConstants['block']
      });
      return renderResult(response, res, 'application/json');
    } else {
      return renderResult(
        responseHelper.error(requestResponse.err.code, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
        res,
        'application/json'
      );
    }
  });
});

module.exports = router;
