"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
;

/**
 * Get details of token transfer graph for a branded token
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 contractAddress - contract address of branded token
 *
 * @Constructor
 */
const GetTokenTranferGraphKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.contractAddress = params.contractAddress
};


GetTokenTranferGraphKlass.prototype = {

  /**
   * Perform operation of getting token transfer graph details
   *
   * @return {Promise<void>}
   */
  perform: async function () {

    return Promise.resolve(responseHelper.successWithData());
  }
};

module.exports = GetTokenTranferGraphKlass;