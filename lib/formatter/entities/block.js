'use strict';

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/entities/Base');

class Block extends BaseFormatter {
  /**
   * constructor
   */
  constructor() {
    super();
  }

  /**
   * perform
   *
   * @param blockData
   * @return {Promise<any>}
   */
  async perform(blockData) {
    const oThis = this;

    const mandatoryRootLevelKeys = oThis.responseDefinition();

    await oThis.validateResponse(blockData, mandatoryRootLevelKeys);

    return Promise.resolve(oThis.formatEntity(blockData));
  }

  /**
   * formatEntity
   *
   * @param blockData
   * @return {{}}
   */
  formatEntity(blockData) {
    let formattedBlockData = {};

    formattedBlockData.chainId = blockData.chainId;
    formattedBlockData.blockHash = blockData.blockHash;
    formattedBlockData.gasUsed = blockData.gasUsed;
    formattedBlockData.blockNumber = blockData.blockNumber;
    formattedBlockData.totalTransactions = blockData.totalTransactions;
    formattedBlockData.blockTimestamp = blockData.blockTimestamp;
    formattedBlockData.nonce = blockData.nonce;

    return formattedBlockData;
  }

  /**
   * responseDefinition
   *
   * @return {string[]}
   */
  responseDefinition() {
    const oThis = this,
      mandatoryRootLevelKeys = [
        'chainId',
        'blockHash',
        'gasUsed',
        'blockNumber',
        'totalTransactions',
        'blockTimestamp',
        'nonce'
      ];
    return mandatoryRootLevelKeys;
  }
}

module.exports = new Block();
