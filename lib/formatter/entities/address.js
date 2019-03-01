'use strict';

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/entities/Base');

class Address extends BaseFormatter {
  /**
   * constructor
   */
  constructor() {
    super();
  }

  /**
   * perform
   *
   * @param addressData
   * @return {Promise<any>}
   */
  async perform(addressData) {
    const oThis = this;

    const mandatoryRootLevelKeys = oThis.responseDefinition();

    await oThis.validateResponse(addressData, mandatoryRootLevelKeys);

    return oThis.formatEntity(addressData);
  }

  /**
   * formatEntity
   *
   * @param addressData
   * @return {{}}
   */
  formatEntity(addressData) {
    let formattedTransferData = {};

    formattedTransferData['address'] = addressData['address'];
    formattedTransferData['balance'] = addressData['balance'];
    formattedTransferData['totalTransactions'] = addressData['totalTransactions'];
    formattedTransferData['chainId'] = addressData['chainId'];

    return formattedTransferData;
  }

  /**
   * responseDefinition
   *
   * @return {string[]}
   */
  responseDefinition() {
    const oThis = this,
      mandatoryRootLevelKeys = ['address', 'balance', 'totalTransactions', 'chainId'];
    return mandatoryRootLevelKeys;
  }
}

module.exports = new Address();
