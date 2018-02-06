"use strict";
/**
 * Chain details related routes.<br><br>
 * Base url for all routes given below is: <b>base_url = /chain-id/:chainId/chainDetails</b>
 *
 * @module Explorer Routes - Token Details
 */
const express = require('express');

// Express router to mount contract related routes
const router = express.Router({mergeParams: true});

// load all internal dependencies
const rootPrefix = ".."
    , contract = require(rootPrefix + '/models/contract')
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
    , coreConfig = require(rootPrefix + '/config')
    , logger = require(rootPrefix + '/helpers/custom_console_logger')
    ;

// Render final response
const renderResult = function (requestResponse, responseObject, contentType) {
    return requestResponse.renderResponse(responseObject, 200, contentType);
};

// define parameters from url, generate web rpc instance and database connect
const contractMiddleware = function (req, res, next) {
    const chainId = req.params.chainId
        , contractAddress = req.params.contractAddress
        ;
    // Get instance of contract class
    req.contractInstance = new contract(chainId);

    req.chainId = chainId;
    req.contractAddress = contractAddress;

    next();
};

/**
 * Get chain basic details
 *
 * @name Contract Internal Transactions
 *
 * @route {GET} {base_url}/:contractAddress/internal-transactions/:page
 *
 * @routeparam {String} :contractAddress - Contract address whose internal transactions need to be fetched (42 chars length)
 * @routeparam {Integer} :page - Page number for getting data in batch.
 */
router.get("/", contractMiddleware, function (req, res) {

    const response = responseHelper.successWithData({
        token_details : { coin_name: 'Frenco Coin', contract_address: req.contractAddress, transaction_url:'http://localhost:3000/chain-id/141/contract/0x9B3d6cCd2Db9A911588bC1715F91320C8Ce28c9e/internal-transactions/1' },
        result_type: "token_details"
    });
    logger.log("Request of content-type:", req.headers['content-type']);
    renderResult(response, res, req.headers['content-type']);
});

router.get("/graph/tokenTransfers/:size", contractMiddleware, function (req, res) {

    const response = responseHelper.successWithData({
        token_details : { coin_name: 'Frenco Coin', contract_address: req.contractAddress, transaction_url:'http://localhost:3000/chain-id/141/contract/0x9B3d6cCd2Db9A911588bC1715F91320C8Ce28c9e/internal-transactions/1' },
        result_type: "token_details"
    });
    logger.log("Request of content-type:", req.headers['content-type']);
    renderResult(response, res, req.headers['content-type']);
});

router.get("/graph/volume/:size", contractMiddleware, function (req, res) {

    const response = responseHelper.successWithData({
        token_details : { coin_name: 'Frenco Coin', contract_address: req.contractAddress, transaction_url:'http://localhost:3000/chain-id/141/contract/0x9B3d6cCd2Db9A911588bC1715F91320C8Ce28c9e/internal-transactions/1' },
        result_type: "token_details"
    });
    logger.log("Request of content-type:", req.headers['content-type']);
    renderResult(response, res, req.headers['content-type']);
});

router.get("/graph/transactions/:size", contractMiddleware, function (req, res) {

    const response = responseHelper.successWithData({
        token_details : { coin_name: 'Frenco Coin', contract_address: req.contractAddress, transaction_url:'http://localhost:3000/chain-id/141/contract/0x9B3d6cCd2Db9A911588bC1715F91320C8Ce28c9e/internal-transactions/1' },
        result_type: "token_details"
    });
    logger.log("Request of content-type:", req.headers['content-type']);
    renderResult(response, res, req.headers['content-type']);
});


module.exports = router;