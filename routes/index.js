'use strict';
/**
 * Index route.<br><br>
 * Base url for all routes given below is: <b>base_url = /</b>
 *
 * @module Explorer Routes - Index
 */
const express = require('express');

// Express router to mount search related routes
const router = express.Router({ mergeParams: true });

const rootPrefix = '..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  handlebarHelper = require(rootPrefix + '/helpers/handlebarHelper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  baseRoutes = require(rootPrefix + '/lib/globalConstant/baseRoutes'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  canonicalConstant = require(rootPrefix + '/lib/globalConstant/canonical');

// Render final response
const renderResult = function(requestResponse, responseObject, contentType) {
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
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  fetchHomeData(req, res, next);
});

function fetchHomeData(req, res, next) {
  require(rootPrefix + '/app/services/home/GetHomePageStats');

  return routeHelper.performer(req, res, next, 'GetHomePageStats', 'r_a_2').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processHomeDetailsResponse(requestResponse.data, req, res);
    } else {
      logger.log(req.originalUrl + ' : ' + requestResponse.err.code);
      return renderResult(
        responseHelper.error(requestResponse.err.code, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
        res,
        req.headers['content-type']
      );
    }
  });
}

function processHomeDetailsResponse(requestResponse, req, res) {
  let rawResponse = {
    stats: {
      totalCommunities: requestResponse.totalEconomies || 0,
      totalTokenHolders: requestResponse.totalTokenHolders || 0,
      totalTokenTransfers: requestResponse.totalTokenTransfers || 0
    },
    meta: {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      urlTemplates: baseRoutes.getAllUrls(),
      currencySymbol: handlebarHelper.ostCurrencySymbol(true)
    },
    title: 'OST View - OST SideChains Explorer and Search',
    mCss: ['mHome.css'],
    mJs: ['mHome.js'],
    view_data: {},
    page_meta: {
      title: 'OST VIEW - Block Explorer for OpenST Utility Blockchains',
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      canonical: canonicalConstant.forHome(),
      robots: 'index, follow',
      image: `${coreConstants.CLOUD_FRONT_BASE_DOMAIN}/ost-view/images/ost-view-og-image-1.jpg`
    },
    constants: {
      cloud_front_base_domain: coreConstants.CLOUD_FRONT_BASE_DOMAIN
    },
    template: coreConstants.home
  };

  return renderResult(responseHelper.successWithData(rawResponse), res, req.headers['content-type']);
}

module.exports = router;
