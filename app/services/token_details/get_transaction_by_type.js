"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
;

/**
 * Get details of transaction by type for a branded token
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 contractAddress - contract address of branded token
 *
 * @Constructor
 */
const GetTransactionByTypeGraphKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.contractAddress = params.contractAddress
};


GetTransactionByTypeGraphKlass.prototype = {

  /**
   * Perform operation of getting transaction by type graph details
   *
   * @return {Promise<void>}
   */
  perform: async function () {

    return Promise.resolve(responseHelper.successWithData());
  }
}

module.exports = GetTransactionByTypeGraphKlass;