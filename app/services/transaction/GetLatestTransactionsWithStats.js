'use strict';

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/cacheManagement/HomePageStats');
require(rootPrefix + '/app/services/home/GetLatestTransactions');

class WebHomePage {
  constructor(params) {
    const oThis = this;

    oThis.paginationIdentifier = params.paginationIdentifier;
    oThis.timeSlot = params.timeSlot;
    oThis.paginationTime = params.paginationTime;

    oThis.homePageStats = null;
    oThis.latestTransactions = null;
  }

  /**
   * perform
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/transaction/GetLatestTransactionsWithStats.js');
      return responseHelper.error('a_s_t_gltws_1', 'something_went_wrong', err);
    });
  }

  /**
   * asyncPerform
   *
   * @return {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this;

    let promiseArray = [];

    promiseArray.push(oThis._fetchHomePageStats());
    promiseArray.push(oThis._fetchLatestTransaction());

    await Promise.all(promiseArray);

    let finalResponse = {
      stats: oThis.homePageStats,
      latestTransactions: oThis.latestTransactions
    };
    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Fetch home page stats.
   *
   * @returns {Promise<*|result|Object<Result>>}
   * @private
   */
  async _fetchHomePageStats() {
    const oThis = this,
      HomePageStatsCache = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'HomePageStatsCache'),
      homePageStatsCache = new HomePageStatsCache();

    let response = await homePageStatsCache.fetch();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.homePageStats = response.data;

    return responseHelper.successWithData({});
  }

  /**
   * Fetch latest transactions
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchLatestTransaction() {
    const oThis = this;

    let LatestTransactionsService = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'GetLatestTransactions'),
      latestTransactionsServiceObj = new LatestTransactionsService({
        timeSlot: oThis.timeSlot,
        paginationIdentifier: oThis.paginationIdentifier,
        paginationTime: oThis.paginationTime
      });

    let response = await latestTransactionsServiceObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.latestTransactions = response.data;

    return responseHelper.successWithData({});
  }
}

InstanceComposer.registerAsShadowableClass(WebHomePage, coreConstants.icNameSpace, 'GetLatestTransactionWithStats');

module.exports = WebHomePage;
