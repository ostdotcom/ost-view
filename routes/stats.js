'use strict';
/**
 * Stats route.<br><br>
 *
 *
 * @module Explorer Routes - Stats
 */
const express = require('express');

// Express router to mount search related routes
const router = express.Router({ mergeParams: true });

const rootPrefix = '..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  JwtAuthentication = require(rootPrefix + '/lib/Authentication/jwt'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  routeHelper = require(rootPrefix + '/routes/helper');

// Render final response
const renderResult = function(requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};

/**
 * Stats route
 *
 * @name Stats route
 *
 * @route {GET} {base_url}
 *
 */
router.get('/', JwtAuthentication.authenticate, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  fetchHomeData(req, res, next);
});

function fetchHomeData(req, res, next) {
  require(rootPrefix + '/app/services/home/GetHomePageStats');

  return routeHelper.performer(req, res, next, 'GetHomePageStats', 'r_s_1').then(function(requestResponse) {
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
    }
  };

  return renderResult(responseHelper.successWithData(rawResponse), res, 'application/json');
}

module.exports = router;
