'use strict';
/**
 * About related routes.
 * Base url for all routes given below is: <b>base_url = /</b>
 *
 * @module Explorer Routes - About
 */
const express = require('express');

// Express router to mount block related routes
const router = express.Router({ mergeParams: true });

// load all internal dependencies
const rootPrefix = '..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  baseRoutes = require(rootPrefix + '/lib/globalConstant/baseRoutes'),
  handlebarHelper = require(rootPrefix + '/helpers/handlebarHelper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  canonicalConstant = require(rootPrefix + '/lib/globalConstant/canonical');

// Render final response
const renderResult = function(requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, requestResponse.isSuccess() ? 200 : 500, contentType);
};

router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  let rawResponse = {
    meta: {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      urlTemplates: baseRoutes.getAllUrls(),
      currencySymbol: handlebarHelper.ostCurrencySymbol(true)
    },
    page_meta: {
      title: 'OST VIEW | About',
      description: 'About OST VIEW, the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      canonical: canonicalConstant.forAbout,
      robots: 'index, follow',
      image: `${coreConstants.CLOUD_FRONT_BASE_DOMAIN}/ost-view/images/ost-view-og-image-1.jpg`
    },
    title: 'OST VIEW - About',
    constants: {
      cloud_front_base_domain: coreConstants.CLOUD_FRONT_BASE_DOMAIN
    },
    template: coreConstants.about
  };

  return renderResult(responseHelper.successWithData(rawResponse), res, req.headers['content-type']);
});

module.exports = router;
