/**
 * Module for route templates.
 *
 * @module lib/globalConstant/baseRoutes
 */

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for route templates
 *
 * @class BaseRoutes
 */
class BaseRoutes {
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

    return {
      token: oThis.token,
      block: oThis.block,
      transaction: oThis.transaction,
      address: oThis.address,
      tokenHolder: oThis.tokenHolder
    };
  }
}

module.exports = new BaseRoutes();
