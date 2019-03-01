'use strict';

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/entities/Base');

class TokenHolderSearch extends BaseFormatter {
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
    let formattedNameSearchResults = {};

    formattedNameSearchResults['chainId'] = tokenHolderData['chainId'];
    formattedNameSearchResults['contractAddress'] = tokenHolderData['contractAddress'];
    formattedNameSearchResults['name'] = tokenHolderData['displayName'];

    return formattedNameSearchResults;
  }

  /**
   * responseDefinition
   *
   * @return {string[]}
   */
  responseDefinition() {
    const oThis = this,
      mandatoryRootLevelKeys = ['displayName', 'chainId', 'contractAddress'];
    return mandatoryRootLevelKeys;
  }
}

module.exports = new TokenHolderSearch();
