'use strict';

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/entities/Base');

class TokenNameSearch extends BaseFormatter {
  /**
   * constructor
   */
  constructor() {
    super();
  }

  /**
   * perform
   *
   * @param tokenNameSearchData
   * @return {Promise<any>}
   */
  async perform(tokenNameSearchData) {
    const oThis = this;

    const mandatoryRootLevelKeys = oThis.responseDefinition();

    await oThis.validateResponse(tokenNameSearchData, mandatoryRootLevelKeys);

    return Promise.resolve(oThis.formatEntity(tokenNameSearchData));
  }

  /**
   * formatEntity
   *
   * @param tokenHolderData
   * @return {{}}
   */
  formatEntity(tokenHolderData) {
    let formattedNameSearchResults = {};

    formattedNameSearchResults['name'] = tokenHolderData['displayName'];
    formattedNameSearchResults['symbol'] = tokenHolderData['displaySymbol'];
    formattedNameSearchResults['chainId'] = tokenHolderData['chainId'];
    formattedNameSearchResults['contractAddress'] = tokenHolderData['contractAddress'];

    return formattedNameSearchResults;
  }

  /**
   * responseDefinition
   *
   * @return {string[]}
   */
  responseDefinition() {
    const oThis = this,
      mandatoryRootLevelKeys = ['displayName', 'displaySymbol', 'chainId', 'contractAddress'];
    return mandatoryRootLevelKeys;
  }
}

module.exports = new TokenNameSearch();
