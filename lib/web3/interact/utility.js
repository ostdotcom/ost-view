"use strict";

const BigNumber = require("bignumber.js");

const reqPrefix           = "../../.."
    , responseHelper      = require( reqPrefix + "/lib/formatter/response" )
    , logger              = require( reqPrefix + '/helpers/custom_console_logger')
    , coreAddresses       = require( reqPrefix + "/config/core_addresses" )
;

/**
 * @constructor
 */
const utilityInteract = module.exports = function () {

};

utilityInteract.prototype = {

  _getBalance: function (address, contractInteract) {

    var oThis = this;

    if (!oThis._isValidBlockChainAdress(address)) {
      return Promise.resolve(responseHelper.error('l_w_i_b_7', 'Invalid Address'));
    }

    return contractInteract.balanceOf( address )
        .then( function(result){
          var stringBalance = result.data['balance'];
          var responseData =  responseHelper.successWithData({
            weiBalance: new BigNumber(stringBalance),
            absoluteBalance: oThis._toETHfromWei(stringBalance)
          });
          return Promise.resolve(responseData);
        })
        .catch( function(reason) {
          logger.error('getBalance for addr: ', address, 'failed beacuse: ', reason);
          var responseData = responseHelper.error('l_w_i_b_1', 'Something went wrong');
          return Promise.resolve(responseData);
        });
  }


  ,_isValidBlockChainAdress: function(address) {
    return this.web3RpcProvider.utils.isAddress(address);
  }

}