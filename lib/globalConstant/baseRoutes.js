'use strict';

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Route templates
 *
 * @module lib/globalConstant/baseRoutes.js
 */
class BaseRoutes {
  constructor() {}

  get token() {
    return '/' + coreConstants.BASE_URL_PREFIX + '/token/ec-{{chainId}}-{{contractAddress}}';
  }

  get block() {
    return '/' + coreConstants.BASE_URL_PREFIX + '/block/bk-{{chainId}}-{{blockNumber}}';
  }

  get transaction() {
    return '/' + coreConstants.BASE_URL_PREFIX + '/transaction/tx-{{chainId}}-{{transactionHash}}';
  }

  get address() {
    return '/' + coreConstants.BASE_URL_PREFIX + '/address/ad-{{chainId}}-{{address}}';
  }

  get tokenHolder() {
    return '/' + coreConstants.BASE_URL_PREFIX + '/token/th-{{chainId}}-{{contractAddress}}-{{address}}';
  }

  getAllUrls() {
    const oThis = this;
    let urlTemplates = {};
    urlTemplates['token'] = oThis.token;
    urlTemplates['block'] = oThis.block;
    urlTemplates['transaction'] = oThis.transaction;
    urlTemplates['address'] = oThis.address;
    urlTemplates['tokenHolder'] = oThis.tokenHolder;

    return urlTemplates;
  }
}

module.exports = new BaseRoutes();
