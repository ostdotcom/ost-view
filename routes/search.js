'use strict';
/**
 * Search route.<br><br>
 * Base url for all routes given below is: <b>base_url = /</b>
 *
 * @module Explorer Routes - Search
 */
const express = require('express');

// Express router to mount search related routes
const router = express.Router({ mergeParams: true });

const rootPrefix = '..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  routeHelper = require(rootPrefix + '/routes/helper');

// Render final response
const renderResult = function(requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, 200, contentType);
};

/**
 * Search by address, contract address, transaction hash, block number
 *
 * @name Search
 *
 * @route {GET} {base_url}/:param
 *
 * @routeparam {String} :params - search string
 */
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/search/Index');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  routeHelper.performer(req, res, next, 'SearchIndex', 'r_i_s_1').then(function(requestResponse) {
    let response = {};
    if (requestResponse.isSuccess()) {
      response = responseHelper.successWithData({
        searchResults: requestResponse.data
      });
    } else {
      response = responseHelper.successWithData({
        searchResults: []
      });
    }
    response['meta'] = {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX
    };
    return renderResult(response, res, 'application/json');
  });
});

module.exports = router;
