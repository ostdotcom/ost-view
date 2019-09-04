'use strict';
/**
 * Token details related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/tokenDetails</b>
 *
 * @module routes/tokenDetails
 */
const express = require('express');

// Express router to mount contract related routes
const router = express.Router({ mergeParams: true });

// load all internal dependencies
const rootPrefix = '..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  baseRoutes = require(rootPrefix + '/lib/globalConstant/baseRoutes'),
  routeHelper = require(rootPrefix + '/routes/helper');

// Render final response
const renderResult = function(requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, requestResponse.isSuccess() ? 200 : 500, contentType);
};

/**
 * Get contract details
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/internal-transactions/:page
 *
 * @routeparam {Number} :chainId - ChainId on which the economy is present
 * @routeparam {String} :contractAddress - contract address of the economy
 */
router.get('/ec-:chainId-:contractAddress', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/contract/GetDetails');

  routeHelper.performer(req, res, next, 'GetContractDetails', 'r_td_1').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processTokenDetailsResponse(requestResponse.data, req, res);
    } else {
      logger.log(req.originalUrl + ' : ' + requestResponse.err.code);
      return renderResult(
        responseHelper.error(requestResponse.err.code, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
        res,
        req.headers['content-type']
      );
    }
  });
});

function processTokenDetailsResponse(response, req, res) {
  let tokenDetails = response,
    baseCurrenciesDetails = response.baseCurrencies;

  let rawResponse = {
    token: tokenDetails,
    baseCurrencies: baseCurrenciesDetails,
    meta: {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      urlTemplates: baseRoutes.getAllUrls()
    }
  };

  let webViewResponse = {
    page_meta: {
      title: `OST VIEW | Economy Details - ${tokenDetails.contractAddress}`,
      description: `OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains. Economy Details - ${
        tokenDetails.contractAddress
      }`,
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'index, nofollow',
      image: `${coreConstants.CLOUD_FRONT_BASE_DOMAIN}/ost-view/images/ost-view-og-image-1.jpg`
    },
    mCss: ['mTokenDetails.css'],
    mJs: ['mTokenDetails.js'],
    title: `Economy Details - ${tokenDetails.contractAddress}`,
    constants: {
      cloud_front_base_domain: coreConstants.CLOUD_FRONT_BASE_DOMAIN
    },
    template: coreConstants.tokenDetails
  };

  if (req.headers['content-type'] != 'application/json') {
    Object.assign(rawResponse, webViewResponse);
  }

  return renderResult(responseHelper.successWithData(rawResponse), res, req.headers['content-type']);
}

/**
 * Get token holders
 *
 * @name token Holders
 *
 * @route {GET} {base_url}/holders
 *
 * @routeparam {Object} nextPagePayload - Payload for getting next page
 */
router.get('/ec-:chainId-:contractAddress/token-holders/top', sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  require(rootPrefix + '/app/services/economy/GetHolders');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  routeHelper.performer(req, res, next, 'GetHolders', 'r_td_2').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processTokenHoldersResponse(requestResponse.data, req, res);
    } else {
      logger.log(req.originalUrl + ' : ' + requestResponse.err.code);
      return renderResult(
        responseHelper.error(requestResponse.err.code, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
        res,
        req.headers['content-type']
      );
    }
  });
});

function processTokenHoldersResponse(queryResponse, req, res) {
  let tokenHolders = queryResponse.tokenHolders,
    nextPagePayload = queryResponse.nextPagePayload;

  const responseData = responseHelper.successWithData({
    tokenHolders: tokenHolders,
    meta: {
      urlTemplates: baseRoutes.urlTemplates,
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      nextPagePayload: nextPagePayload
    }
  });

  return renderResult(responseData, res, 'application/json');
}

/**
 * Get token transfers
 *
 * @name token transfers
 *
 * @route {GET} {base_url}/token/ec-:chainId-:contractAddress/token-transfers
 *
 * @routeparam {Object} nextPagePayload - Payload for getting next page
 */
router.get('/ec-:chainId-:contractAddress/token-transfers', sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  require(rootPrefix + '/app/services/economy/GetTransfers');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  routeHelper.performer(req, res, next, 'GetEconomyTransfers', 'r_td_3').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processTokenTransfersResponse(requestResponse.data, req, res);
    } else {
      logger.log(req.originalUrl + ' : ' + requestResponse.err.code);
      return renderResult(
        responseHelper.error(requestResponse.err.code, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
        res,
        req.headers['content-type']
      );
    }
  });
});

function processTokenTransfersResponse(queryResponse, req, res) {
  let tokenTransfers = queryResponse.tokenTransfers,
    nextPagePayload = queryResponse.nextPagePayload;

  const responseData = responseHelper.successWithData({
    tokenTransfers: tokenTransfers,

    meta: {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      nextPagePayload: nextPagePayload
    }
  });

  return renderResult(responseData, res, 'application/json');
}

/**
 * Get top tokens
 *
 * @name Top Tokens
 *
 * @route {GET} {base_url}/top
 *
 */
router.get('/top', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/home/TopTokens');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  routeHelper.performer(req, res, next, 'TopTokens', 'r_tt_2').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processTopTokensResponse(requestResponse.data, req, res);
    } else {
      logger.log(req.originalUrl + ' : ' + requestResponse.err.code);
      return renderResult(
        responseHelper.error(requestResponse.err.code, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
        res,
        'application/json'
      );
    }
  });
});

function processTopTokensResponse(queryResponse, req, res) {
  const response = responseHelper.successWithData({
    tokens: queryResponse.tokens,
    baseCurrencies: queryResponse.baseCurrencies,
    meta: {
      nextPagePayload: queryResponse.nextPagePayload
    }
  });

  return renderResult(response, res, 'application/json');
}

/**
 * Get details (balance and transactions) of a given address
 *
 * @name Address Details
 *
 * @route {GET} {base_url}/:address
 *
 * @routeparam {String} :address - Address whose details need to be fetched (42 chars length)
 */
router.get('/th-:chainId-:contractAddress-:address', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/economy/GetBalance');

  routeHelper.performer(req, res, next, 'GetTokenHolderBalance', 'r_a_1').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processTokenHolderResponse(requestResponse.data, req, res);
    } else {
      logger.log(req.originalUrl + ' : ' + requestResponse.err.code);
      return renderResult(
        responseHelper.error(requestResponse.err.code, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
        res,
        req.headers['content-type']
      );
    }
  });
});

function processTokenHolderResponse(response, req, res) {
  const tokenHolderDetails = response.tokenHolderDetails,
    tokenDetails = response.tokenDetails,
    baseCurrenciesDetails = response.baseCurrencies,
    urlTemplates = baseRoutes.getAllUrls();

  let rawResponse = {
    tokenHolder: tokenHolderDetails,
    token: tokenDetails,
    baseCurrencies: baseCurrenciesDetails,
    meta: {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      urlTemplates: urlTemplates
    }
  };

  let webViewResponse = {
    page_meta: {
      title: `OST VIEW | Address Details - ${tokenHolderDetails.address}`,
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'noindex, nofollow',
      image: `${coreConstants.CLOUD_FRONT_BASE_DOMAIN}/ost-view/images/ost-view-og-image-1.jpg`
    },
    mCss: ['mTokenAddressDetails.css'],
    mJs: ['mTokenAddressDetails.js'],
    title: `Address Details - ${tokenHolderDetails.address}`,
    constants: {
      cloud_front_base_domain: coreConstants.CLOUD_FRONT_BASE_DOMAIN
    },
    template: coreConstants.tokenAddressDetails
  };

  if (req.headers['content-type'] != 'application/json') {
    Object.assign(rawResponse, webViewResponse);
  }

  return renderResult(responseHelper.successWithData(rawResponse), res, req.headers['content-type']);
}

/**
 * Get paginated address transactions
 *
 * @name Address Transactions
 *
 * @route {GET} {base_url}/th-:chainId-:contractAddress-:address/token-transfers/:page
 *
 * @routeparam {String} :address - Address whose balance need to be fetched (42 chars length)
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get('/th-:chainId-:contractAddress-:address/token-transfers', sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  require(rootPrefix + '/app/services/address/Transfers');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  routeHelper.performer(req, res, next, 'GetAddressTransfers', 'r_a_2').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processTokenHolderTokenTransferResponse(requestResponse.data, req, res);
    } else {
      logger.log(req.originalUrl + ' : ' + requestResponse.err.code);
      return renderResult(
        responseHelper.error(requestResponse.err.code, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
        res,
        'application/json'
      );
    }
  });
});

function processTokenHolderTokenTransferResponse(queryResponse, req, res) {
  const tokenTransfers = queryResponse.tokenTransfers,
    currencySymbol = queryResponse.currencySymbol,
    nextPagePayload = queryResponse.nextPagePayload;

  // For all the pages remove last row if its equal to page size.

  const response = responseHelper.successWithData({
    tokenTransfers: tokenTransfers,
    meta: {
      nextPagePayload: nextPagePayload,
      currencySymbol: currencySymbol,
      q: req.params.address
    }
  });

  return renderResult(response, res, 'application/json');
}

module.exports = router;
