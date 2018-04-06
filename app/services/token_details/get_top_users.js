"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , TopUsersCacheKlass = require(rootPrefix + '/lib/cache_management/top_users')
;

const defaultTopUsersCount = 15;

/**
 * Get Details of a top users for branded token
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 contractAddress - contract address of branded token
 *                 topUserCount - number of top users need tobe fetched

 *
 * @Constructor
 */

const GetTopUsersKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.contractAddress = params.contractAddress;
  oThis.topUsersCount = params.topUserCount;

  if (!oThis.topUsersCount){
    oThis.topUsersCount = defaultTopUsersCount;
  }
};

GetTopUsersKlass.prototype = {

  /**
   * Perform operation of getting top users details
   *
   * @return {Promise<void>}
   */
  perform: async function () {
    const oThis = this
      , topUsers = await new TopUsersCacheKlass({chain_id:oThis.chainId, contract_address:oThis.contractAddress}).fetch()
      , topUsersData = topUsers.data;
    ;

    if (topUsers.isFailure()){
      return Promise.resolve(responseHelper.error('s_td_gtu_1','top users data not found for :'+oThis.contractAddress));
    }

    const formattedData = topUsersData.slice(0, oThis.topUsersCount);

    return Promise.resolve(responseHelper.successWithData({top_users:formattedData}));
  }

};

module.exports = GetTopUsersKlass;