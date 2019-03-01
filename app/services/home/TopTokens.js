/*
 * TopTokens - Service to get top tokens
 * 1. First page from cache
 * 2. Rest from DB
 */

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/app/services/home/GetTopTokens');
require(rootPrefix + '/lib/cacheManagement/TopTokensCache');

class TopTokens {
  /**
   * constructor
   *
   * @params
   * @param [paginationIdentifier] {String} - Identifier for pagination
   */
  constructor(params) {
    const oThis = this;

    oThis.paginationIdentifier = params.paginationIdentifier;
  }

  /**
   * perform
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/home/TopTokens.js');
      return responseHelper.error('s_h_tt_1', 'something_went_wrong', err);
    });
  }

  /**
   * asyncPerform
   *
   * @return {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this;

    if (!oThis.paginationIdentifier) {
      return oThis.getFirstPage();
    } else {
      return oThis.getTopTokensFromService();
    }

    return responseHelper.successWithData(result);
  }

  /**
   * getFirstPage
   */
  async getFirstPage() {
    const oThis = this,
      TopTokensCache = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'TopTokensCache'),
      topTokensCache = new TopTokensCache();

    let response = await topTokensCache.fetch();

    return responseHelper.successWithData(response.data);
  }

  /**
   * getTopTokensFromService
   */
  async getTopTokensFromService() {
    const oThis = this,
      GetTopTokens = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'GetTopTokens'),
      getTopTokens = new GetTopTokens({
        paginationIdentifier: oThis.paginationIdentifier
      });

    return getTopTokens.perform();
  }
}

InstanceComposer.registerAsShadowableClass( TopTokens, coreConstants.icNameSpace, 'TopTokens');

module.exports = TopTokens;
