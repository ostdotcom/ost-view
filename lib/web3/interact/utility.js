"use strict";

const BigNumber = require("bignumber.js");

const reqPrefix           = "../../.."
    , responseHelper      = require( reqPrefix + "/lib/formatter/response" )
    , coreAddresses       = require( reqPrefix + "/config/core_addresses" )
    , web3RpcProvider = require(reqPrefix + "/lib/web3/providers/utility_rpc");

;


const utilityInteract = {

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
          var responseData = responseHelper.error('l_w_i_b_1', 'Something went wrong in _getBalance',reason);
          return Promise.resolve(responseData);
        });
  }


  ,_isValidBlockChainAdress: function(address) {
    return web3RpcProvider.utils.isAddress(address);
  }

  , _toETHfromWei: function(stringValue) {

    if ( typeof stringValue != 'string' ) {
      stringValue = String( stringValue );
    }

    return web3RpcProvider.utils.fromWei( stringValue, "ether" );

  },

}

module.exports = utilityInteract;