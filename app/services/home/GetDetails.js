'use strict';
/*
 * GetHomePageDetails - Service for getting HomePage details
 *
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@openstfoundation/openst-base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/models/GlobalStats');

class GetHomeDetails {
  /**
   * constructor
   */
  constructor() {}

  /**
   * perform
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/home/GetDetails.js');
      return responseHelper.error('s_h_gd_1', 'something_went_wrong', err);
    });
  }

  /**
   * asyncPerform
   *
   * @return {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this;

    let response = await oThis.getHomePageStats();

    return responseHelper.successWithData(response.data['1']);
  }

  /**
   * Returns home page stats.
   *
   * @returns {Promise<*>}
   */
  async getHomePageStats() {
    const oThis = this,
      GlobalStats = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'GlobalStats'),
      globalStatsObj = new GlobalStats({ consistentRead: false });

    let response = await globalStatsObj.getData();

    return response;
  }
}

InstanceComposer.registerAsShadowableClass(GetHomeDetails, coreConstants.icNameSpace, 'GetHomeDetails');
