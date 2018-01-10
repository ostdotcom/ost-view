"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on SimpleToken Contract.<br><br>
 *
 * @module lib/contract_interact/simpleToken
 *
 */


const BigNumber = require('bignumber.js');

const rootPrefix = '../..'
  , contractName = 'SimpleToken'
  , web3RpcProvider = require(rootPrefix+'/lib/web3/providers/value_rpc')
  , helper = require(rootPrefix+'/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , coreConstants = require(rootPrefix+'/config/core_constants')
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(coreAddresses.getAbiForContract(contractName))
;

const simpleTokenContractInteract = {

  /**
   * Get ST balance of an address
   *
   * @param {String} addr - address of which ST balance is to be fetched
   *
   * @return {Promise}
   *
   */
	balanceOf: function (addr) {

    const encodedABI = currContract.methods.balanceOf(addr).encodeABI();

    return helper.call(web3RpcProvider, currContractAddr, encodedABI, {}, ['uint256'])
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData({balance: response[0]}));
      });  
  	},
}

module.exports = simpleTokenContractInteract;