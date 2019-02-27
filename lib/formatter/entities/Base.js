'use strict';

const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class BaseFormatter {
  /**
   * constructor
   */
  constructor() {}

  /**
   * validateResponse
   *
   * @param inputData
   * @param mandatoryRootLevelKeys
   * @return {Promise}
   */
  async validateResponse(inputData, mandatoryRootLevelKeys) {
    const oThis = this;

    for (let i = 0; i < mandatoryRootLevelKeys.length; i++) {
      if (!inputData.hasOwnProperty(mandatoryRootLevelKeys[i])) {
        return Promise.reject(
          responseHelper.error('l_f_e_b_1', 'entity_formatting_failed_on_key_' + mandatoryRootLevelKeys[i])
        );
      }
    }
  }
}

module.exports = BaseFormatter;
