"use strict";
/**
 * Blocks related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/blocks</b>
 *
 * @module Explorer Routes - Blocks
 */
const express = require('express');

// Express router to mount blocks related routes
const router = express.Router({mergeParams: true});

// load all internal dependencies
const rootPrefix = ".."
  , block = require(rootPrefix + '/models/block')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

// Render final response
const renderResult = function (requestResponse, responseObject) {
  return requestResponse.renderResponse(responseObject);
};

// define parameters from url, generate web rpc instance and database connect
const blocksMiddleware = function (req, res, next) {
  const chainId = req.params.chainId
    , page = req.params.page;

  req.blocksInstance = new block(chainId);

  req.chainId = chainId;
  req.page = page;

  next();
};

/**
 * Get paginated blocks by recency
 *
 * @name Recent Blocks
 *
 * @route {GET} {base_url}/recent/:page
 *
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get("/recent/:page", blocksMiddleware, function (req, res) {

  req.blocksInstance.getRecentBlocks(req.page)
    .then(function (requestResponse) {
      const response = responseHelper.successWithData({
        blocks: requestResponse,
        result_type: "blocks"
      });

      return renderResult(response, res);
    })
    .catch(function (reason) {
      logger.log(req.originalUrl + " : " + reason);
      return renderResult(responseHelper.error('', reason), res);
    });
});


module.exports = router;