'use strict';

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/entities/Base');

class TokenTransfer extends BaseFormatter {
  /**
   * constructor
   */
  constructor() {
    super();
  }

  /**
   * perform
   *
   * @param transferData
   * @return {Promise<any>}
   */
  async perform(transferData) {
    const oThis = this;

    const mandatoryRootLevelKeys = oThis.responseDefinition();

    await oThis.validateResponse(transferData, mandatoryRootLevelKeys);

    return Promise.resolve(oThis.formatEntity(transferData));
  }

  /**
   * formatEntity
   *
   * @param transferData
   * @return {{}}
   */
  formatEntity(transferData) {
    let formattedTransferData = {};

    formattedTransferData['transactionHash'] = transferData['transactionHash'];
    formattedTransferData['fromAddress'] = transferData['fromAddress'];
    formattedTransferData['toAddress'] = transferData['toAddress'];
    formattedTransferData['amount'] = transferData['amount'];
    formattedTransferData['timestamp'] = transferData['timeStamp'] || null;
    formattedTransferData['eventIndex'] = transferData['eventIndex'];
    formattedTransferData['contractAddress'] = transferData['contractAddress'];
    formattedTransferData['chainId'] = transferData['chainId'];

    return formattedTransferData;
  }

  /**
   * responseDefinition
   *
   * @return {string[]}
   */
  responseDefinition() {
    const oThis = this,
      mandatoryRootLevelKeys = [
        'transactionHash',
        'fromAddress',
        'toAddress',
        'amount',
        'contractAddress',
        'eventIndex',
        'chainId'
      ];
    return mandatoryRootLevelKeys;
  }
}

module.exports = new TokenTransfer();
