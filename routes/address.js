'use strict';
/**
 * Address related routes.<br><br>
 *
 * @module routes/address
 */
const express = require('express');

// Express router to mount contract related routes
const router = express.Router({ mergeParams: true });

// load all internal dependencies
const rootPrefix = '..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  handlebarHelper = require(rootPrefix + '/helpers/handlebarHelper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  baseRoutes = require(rootPrefix + '/lib/globalConstant/baseRoutes'),
  routeHelper = require(rootPrefix + '/routes/helper');

// Render final response
const renderResult = function(requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, requestResponse.isSuccess() ? 200 : 500, contentType);
};

/**
 * Get address details
 *
 * @name Address details
 *
 *
 * @routeparam chainId {Number} :chainId - ChainId on which the economy is present
 * @routeparam address {String} :address - address for which details needed to be fetched
 */
router.get('/ad-:chainId-:address', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/address/GetBasicDetails');

  routeHelper.performer(req, res, next, 'GetAddressBasicDetails', 'r_ad_1').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processAddressBasicDetailsResponse(requestResponse.data, req, res);
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

function processAddressBasicDetailsResponse(response, req, res) {
  let addressDetails = response;

  let rawResponse = {
    address: addressDetails,
    meta: {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      urlTemplates: baseRoutes.getAllUrls(),
      currencySymbol: handlebarHelper.ostCurrencySymbol(true)
    }
  };

  let webViewResponse = {
    page_meta: {
      title: `OST VIEW | Address Details - ${addressDetails.address}`,
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'noindex, nofollow',
      image: `${coreConstants.CLOUD_FRONT_BASE_DOMAIN}/ost-view/images/ost-view-og-image-1.jpg`
    },
    mCss: ['mAddressDetails.css'],
    mJs: ['mAddressDetails.js'],
    title: `Address Details - ${addressDetails.contractAddress}`,
    constants: {
      cloud_front_base_domain: coreConstants.CLOUD_FRONT_BASE_DOMAIN
    },
    template: coreConstants.addressDetails
  };

  if (req.headers['content-type'] != 'application/json') {
    Object.assign(rawResponse, webViewResponse);
  }

  return renderResult(responseHelper.successWithData(rawResponse), res, req.headers['content-type']);
}

/**
 * Get address transactions
 *
 * @name Address transactions
 *
 * @route {GET} {base_url}/ad-:chainId-:address/transactions
 *
 */
router.get('/ad-:chainId-:address/transactions', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/address/GetAddressTransactions');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  routeHelper.performer(req, res, next, 'GetAddressTransactions', 'r_ad_2').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processAddressTransactionsResponse(requestResponse.data, req, res);
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

function processAddressTransactionsResponse(queryResponse, req, res) {
  let transactions = queryResponse.transactions,
    nextPagePayload = queryResponse.nextPagePayload;

  const responseData = responseHelper.successWithData({
    transactions: transactions,
    meta: {
      urlTemplates: baseRoutes.urlTemplates,
      nextPagePayload: nextPagePayload
    }
  });

  return renderResult(responseData, res, 'application/json');
}

module.exports = router;
