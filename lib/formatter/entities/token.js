'use strict';

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/entities/Base');

class Token extends BaseFormatter {
  /**
   * constructor
   */
  constructor() {
    super();
  }

  /**
   * perform
   *
   * @param tokenData
   * @return {Promise<any>}
   */
  async perform(tokenData) {
    const oThis = this;

    const mandatoryRootLevelKeys = oThis.responseDefinition();

    await oThis.validateResponse(tokenData, mandatoryRootLevelKeys);

    return Promise.resolve(oThis.formatEntity(tokenData));
  }

  /**
   * formatEntity
   *
   * @param tokenData
   * @return {{}}
   */
  formatEntity(tokenData) {
    let formattedTokenData = {};

    formattedTokenData.contractAddress = tokenData.contractAddress;
    formattedTokenData.sortEconomyBy = tokenData.sortEconomyBy;
    formattedTokenData.marketCap = tokenData.marketCap;
    formattedTokenData.chainId = tokenData.chainId;
    formattedTokenData.totalSupply = tokenData.totalSupply;
    formattedTokenData.updatedTimestamp = tokenData.updatedTimestamp;
    formattedTokenData.name = tokenData.displayName;
    formattedTokenData.symbol = tokenData.displaySymbol;
    formattedTokenData.decimals = tokenData.decimals;
    formattedTokenData.conversionFactor = tokenData.conversionFactor;
    formattedTokenData.createdTimestamp = tokenData.createdTimestamp;
    formattedTokenData.totalVolume = tokenData.totalVolume || null;
    formattedTokenData.simpleStakeContractAddress = tokenData.ssa;
    formattedTokenData.valueBrandedToken = tokenData.oca;
    formattedTokenData.totalTransfers = tokenData.totalTokenTransfers;
    formattedTokenData.totalTokenHolders = tokenData.totalTokenHolders;

    return formattedTokenData;
  }

  /**
   * responseDefinition
   *
   * @return {string[]}
   */
  responseDefinition() {
    const oThis = this,
      mandatoryRootLevelKeys = [
        'contractAddress',
        'sortEconomyBy',
        'marketCap',
        'chainId',
        'totalSupply',
        'updatedTimestamp',
        'name',
        'symbol',
        'decimals',
        'createdTimestamp',
        'conversionFactor'
      ];
    return mandatoryRootLevelKeys;
  }
}

module.exports = new Token();
