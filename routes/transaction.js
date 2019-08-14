'use strict';
/**
 * Transaction related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /transaction/tx-:chain_id-:transaction_hash</b>
 *
 * @module Explorer Routes - Transaction
 */
const express = require('express');

// Express router to mount search related routes
const router = express.Router({ mergeParams: true });

// load all internal dependencies
const rootPrefix = '..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  jwt = require(rootPrefix + '/lib/Authentication/jwt'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  baseRoutes = require(rootPrefix + '/lib/globalConstant/baseRoutes'),
  routeHelper = require(rootPrefix + '/routes/helper');

// Render final response
const renderResult = function(requestResponse, responseObject, contentType) {
  return requestResponse.renderResponse(responseObject, requestResponse.isSuccess() ? 200 : 500, contentType);
};

/**
 * Get details of a given transaction hash
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/transaction/tx-:chainId-:transactionHash
 *
 * @routeparam {Number} :chainId - Chain identifier
 * @routeparam {String} :transactionHash - Transaction hash (66 chars length)
 * @routeparam {Number} [:pageNo] - Optional, pageNo for fetching transfers
 */
router.get('/tx-:chainId-:transactionHash', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/transaction/GetDetails');

  routeHelper.performer(req, res, next, 'GetTransactionDetails', 'r_t_1').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processTransactionResponse(requestResponse.data, req, res);
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

function processTransactionResponse(requestResponse, req, res) {
  let rawResponse = {
    transaction: requestResponse.transaction,
    pricePoint: requestResponse.pricePoint,
    meta: {
      baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
      urlTemplates: baseRoutes.getAllUrls()
    }
  };

  let webViewResponse = {
    page_meta: {
      title: `OST VIEW | Tx Details - ${requestResponse.transaction.transactionHash}`,
      description: 'OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.',
      keywords: 'OST, Simple Token, Utility Chain, Blockchain',
      robots: 'noindex, nofollow',
      image: `${coreConstants.CLOUD_FRONT_BASE_DOMAIN}/ost-view/images/ost-view-og-image-1.jpg`
    },
    mCss: ['mTransactionDetails.css'],
    mJs: ['mTransactionDetails.js'],
    title: `Transaction Details - ${requestResponse.transaction.transactionHash}`,
    constants: {
      cloud_front_base_domain: coreConstants.CLOUD_FRONT_BASE_DOMAIN
    },
    template: coreConstants.transaction
  };

  if (req.headers['content-type'] != 'application/json') {
    Object.assign(rawResponse, webViewResponse);
  }

  return renderResult(responseHelper.successWithData(rawResponse), res, req.headers['content-type']);
}

/**
 * Get transfers of a given transaction hash
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/transaction/tx-:chainId-:transactionHash/transfers
 *
 * @routeparam {Number} :chainId - Chain identifier
 * @routeparam {String} :transactionHash - Transaction hash (66 chars length)
 */
router.get('/tx-:chainId-:transactionHash/token-transfers', sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  require(rootPrefix + '/app/services/transfer/GetAll');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  routeHelper.performer(req, res, next, 'GetAllTransfers', 'r_t_1').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processTransactionTokenTransferResponse(requestResponse.data, req, res);
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

function processTransactionTokenTransferResponse(requestResponse, req, res) {
  let rawResponse = {
    tokenTransfers: requestResponse.tokenTransfers,
    economyMap: requestResponse.economyMap,
    baseCurrencies: requestResponse.baseCurrencies,
    meta: {
      nextPagePayload: requestResponse.nextPagePayload
    }
  };

  return renderResult(responseHelper.successWithData(rawResponse), res, 'application/json');
}

/**
 * Get recent transactions of tokens
 *
 * @name Transaction Details
 *
 * @route {GET} {base_url}/transaction/latest
 *
 */
router.get('/latest', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  require(rootPrefix + '/app/services/home/GetLatestTransactions');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  routeHelper.performer(req, res, next, 'GetLatestTransactions', 'r_tt_1').then(function(requestResponse) {
    if (requestResponse.isSuccess()) {
      processLatestTransactionResponse(requestResponse.data, req, res);
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

function processLatestTransactionResponse(queryResponse, req, res) {
  const transactions = queryResponse.transactions,
    pricePoint = queryResponse.pricePoint,
    nextPagePayload = queryResponse.nextPagePayload;

  const response = responseHelper.successWithData({
    transactions: transactions,
    pricePoint: pricePoint,
    meta: {
      nextPagePayload: nextPagePayload,
      currencySymbol: queryResponse.currencySymbol
    }
  });

  return renderResult(response, res, 'application/json');
}

/**
 * Latest with stats
 *
 * @name latest transaction with stats
 *
 * @route {GET} {base_url}
 */
router.get('/latest-with-stats', jwt.authenticate, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  fetchWebHomePageData(req, res, next);
});

function fetchWebHomePageData(req, res, next) {
  require(rootPrefix + '/app/services/transaction/GetLatestTransactionsWithStats');

  if (routeHelper.validateXhrRequest(req, res)) {
    return;
  }

  return routeHelper
    .performer(req, res, next, 'GetLatestTransactionWithStats', 'r_t_2')
    .then(function(requestResponse) {
      if (requestResponse.isSuccess()) {
        processWebHomePageResponse(requestResponse.data, req, res);
      } else {
        logger.log(req.originalUrl + ' : ' + requestResponse.err.code);
        return renderResult(
          responseHelper.error(requestResponse.err.code, coreConstants.DEFAULT_DATA_NOT_AVAILABLE_TEXT),
          res,
          'application/json'
        );
      }
    });
}

function processWebHomePageResponse(queryResponse, req, res) {
  const transactions = queryResponse.latestTransactions.transactions,
    nextPagePayload = queryResponse.latestTransactions.nextPagePayload,
    stats = queryResponse.stats;

  const response = responseHelper.successWithData({
    stats: stats,
    transactions: transactions,
    meta: {
      nextPagePayload: nextPagePayload,
      currencySymbol: queryResponse.latestTransactions.currencySymbol
    }
  });

  return renderResult(response, res, 'application/json');
}

module.exports = router;
