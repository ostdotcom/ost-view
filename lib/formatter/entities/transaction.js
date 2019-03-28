'use strict';

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/entities/Base');

class Transaction extends BaseFormatter {
  /**
   * constructor
   */
  constructor() {
    super();
  }

  /**
   * perform
   *
   * @param transactionData
   * @return {Promise<any>}
   */
  async perform(transactionData) {
    const oThis = this;

    const mandatoryRootLevelKeys = oThis.responseDefinition();

    await oThis.validateResponse(transactionData, mandatoryRootLevelKeys);

    return Promise.resolve(oThis.formatEntity(transactionData));
  }

  /**
   * formatEntity
   *
   * @param transactionData
   * @return {{}}
   */
  formatEntity(transactionData) {
    let formattedTransactionData = {};

    if (transactionData.transactionStatus != '1') {
      // blank or 0
      formattedTransactionData.transactionStatus = transactionData.transactionStatus;
    } else {
      // 1
      formattedTransactionData.transactionStatus = transactionData.transactionInternalStatus != '0' ? '1' : '0';
    }

    formattedTransactionData.value = transactionData.value;
    formattedTransactionData.nonce = transactionData.nonce;
    formattedTransactionData.blockTimestamp = transactionData.blockTimestamp;
    formattedTransactionData.transactionInternalStatus = transactionData.transactionInternalStatus;
    formattedTransactionData.blockNumber = transactionData.blockNumber;
    formattedTransactionData.transactionHash = transactionData.transactionHash;
    formattedTransactionData.fromAddress = transactionData.fromAddress;
    formattedTransactionData.transactionIndex = transactionData.transactionIndex;
    formattedTransactionData.gasPrice = transactionData.gasPrice;
    formattedTransactionData.gasUsed = transactionData.gasUsed;
    formattedTransactionData.contractAddress = transactionData.contractAddress || null;
    formattedTransactionData.updatedTimestamp = transactionData.updatedTimestamp;
    formattedTransactionData.toAddress = transactionData.toAddress || null;
    formattedTransactionData.chainId = transactionData.chainId;
    formattedTransactionData.totalTokenTransfers = transactionData.totalTokenTransfers;
    formattedTransactionData.totalTransferedTokens = transactionData.totalTransferedTokens || null;
    formattedTransactionData.inputData = transactionData.inputData || null;

    return formattedTransactionData;
  }

  /**
   * responseDefinition
   *
   * @return {string[]}
   */
  responseDefinition() {
    const oThis = this,
      mandatoryRootLevelKeys = [
        'value',
        'nonce',
        'blockTimestamp',
        'transactionInternalStatus',
        'blockNumber',
        'transactionHash',
        'fromAddress',
        'transactionIndex',
        'gasPrice',
        'gasUsed',
        'transactionStatus',
        'updatedTimestamp',
        'chainId',
        'totalTokenTransfers'
      ];

    return mandatoryRootLevelKeys;
  }
}

module.exports = new Transaction();
