'use strict';

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/entities/Base');

class TokenHolder extends BaseFormatter {
  /**
   * constructor
   */
  constructor() {
    super();
  }

  /**
   * perform
   *
   * @param tokenHolderData
   * @return {Promise<any>}
   */
  async perform(tokenHolderData) {
    const oThis = this;

    const mandatoryRootLevelKeys = oThis.responseDefinition();

    await oThis.validateResponse(tokenHolderData, mandatoryRootLevelKeys);

    return Promise.resolve(oThis.formatEntity(tokenHolderData));
  }

  /**
   * formatEntity
   *
   * @param tokenHolderData
   * @return {{}}
   */
  formatEntity(tokenHolderData) {
    let formattedTransferData = {};

    formattedTransferData['address'] = tokenHolderData['address'];
    formattedTransferData['balance'] = tokenHolderData['balance'];
    formattedTransferData['chainId'] = tokenHolderData['chainId'];
    formattedTransferData['totalTransfers'] = tokenHolderData['totalTokenTransfers'];
    formattedTransferData['contractAddress'] = tokenHolderData['contractAddress'];

    return formattedTransferData;
  }

  /**
   * responseDefinition
   *
   * @return {string[]}
   */
  responseDefinition() {
    const oThis = this,
      mandatoryRootLevelKeys = ['address', 'balance', 'chainId', 'contractAddress'];
    return mandatoryRootLevelKeys;
  }
}

module.exports = new TokenHolder();
