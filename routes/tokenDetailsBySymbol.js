/**
 * Token details by symbol related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /:tokenSymbol</b>
 *
 * @module routes/tokenDetailsBySymbol
 */
const express = require('express');

// Express router to mount contract related routes.
const router = express.Router({ mergeParams: true });

// Load all internal dependencies.
const rootPrefix = '..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  baseRoutes = require(rootPrefix + '/lib/globalConstant/baseRoutes'),
  canonicalConstant = require(rootPrefix + '/lib/globalConstant/canonical');

// Render final response.
const renderResult = function(requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, requestResponse.isSuccess() ? 200 : 500, contentType);
};

function processTokenDetailsResponse(response, req, res) {
  const tokenDetails = response,
    baseCurrenciesDetails = response.baseCurrencies;

  const rawResponse = {
    token: tokenDetails,
    baseCurrencies: baseCurrenciesDetails,
    meta: {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      urlTemplates: baseRoutes.getAllUrls()
    }
  };

  const webViewResponse = {
    page_meta: {
      title: `OST VIEW | Economy Details - ${tokenDetails.contractAddress}`,
      description: `OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains. Economy Details - ${
        tokenDetails.contractAddress
      }`,
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'index, nofollow',
      canonical: canonicalConstant.forEconomy(response.tokenSymbol),
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

  if (req.headers['content-type'] !== 'application/json') {
    Object.assign(rawResponse, webViewResponse);
  }

  return renderResult(responseHelper.successWithData(rawResponse), res, req.headers['content-type']);
}

/**
 * Get token details by symbol.
 *
 * @name Token details by symbol.
 *
 * @route {GET} {base_url}/:tokenSymbol
 *
 * @routeparam {Number} :tokenSymbol - Token symbol
 */
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/contract/GetDetailsBySymbol');

  routeHelper.performer(req, res, next, 'GetTokenDetailsBySymbol', 'r_tbs_1').then(function(requestResponse) {
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

module.exports = router;
