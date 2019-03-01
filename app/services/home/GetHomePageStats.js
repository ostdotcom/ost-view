'use strict';

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/cacheManagement/HomePageStats');

class GetHomePageStats {
  constructor() {}

  /**
   * perform
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/home/GetHomePageStats.js');
      return responseHelper.error('a_s_h_ghps_1', 'something_went_wrong', err);
    });
  }

  /**
   * asyncPerform
   *
   * @return {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this,
      HomePageStatsCache = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'HomePageStatsCache'),
      homePageStatsCache = new HomePageStatsCache();

    let response = await homePageStatsCache.fetch();

    return responseHelper.successWithData(response.data);
  }
}

InstanceComposer.registerAsShadowableClass(GetHomePageStats, coreConstants.icNameSpace, 'GetHomePageStats');

module.exports = GetHomePageStats;
