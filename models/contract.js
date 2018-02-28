"use strict"
/**
 * Model to fetch contract address related details from database or from chain.
 *
 * @module models/contract
 */

// load all internal dependencies
const rootPrefix = ".."
  , dbInteract = require(rootPrefix + '/lib/storage/interact')
  , constants = require(rootPrefix + '/config/core_constants')
  , coreConfig = require(rootPrefix + '/config')
;

/**
 * @constructor
 *
 * @param {Integer} chainId - chain id to connect to respective geth node and database instance
 */
var contract = module.exports = function (chainId) {
  this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));
}

contract.prototype = {

  /**
   * Get list of Contract ledger for given contract address.
   *
   * @param {Sting} contractAddress - Contract address
   * @param {Integer} page  - Page number
   *
   * @return {Promise<Object>} List of contract internal transaction
   */
  getContractLedger: function (contractAddress, page) {
    const oThis = this;

    return new Promise(function (resolve, reject) {

      if (contractAddress == undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH) {
        reject("invalid input");
        return;
      }

      if (page == undefined || !page || isNaN(page) || page < 0) {
        page = constants.DEFAULT_PAGE_NUMBER;
      }

      oThis._dbInstance.getContractLedger(contractAddress, page, constants.DEFAULT_PAGE_SIZE)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });

    });
  },

  /**
   * Get list of Contract ledger for given contract address.
   *
   * @param {Sting} contractAddress - Contract address
   * @param {Integer} page  - Page number
   *
   * @return {Promise<Object>} List of contract transaction
   */
  getContractTransactions: function (contractAddress, page){
      const oThis = this;

      return new Promise(function (resolve, reject) {

          if (contractAddress == undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH) {
            reject("invalid input");
            return;
          }

          if (page == undefined || !page || isNaN(page) || page < 0) {
            page = constants.DEFAULT_PAGE_NUMBER;
          }

          oThis._dbInstance.getContractTransactions(contractAddress, page, constants.DEFAULT_PAGE_SIZE)
            .then(function (response) {
              resolve(response);
            })
            .catch(function (reason) {
              reject(reason);
            });
      });
  }

  , getTokenDetails: function(contractAddress){
    const oThis = this;
    return new Promise(function (resolve, reject) {

      if (contractAddress == undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH) {
        reject("invalid input");
        return;
      }

      oThis._dbInstance.getCoinFromContractAddress(contractAddress)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }


  ,getTokenDetailsInfo: function(token_details){
    var details = [
      {
        img:"market-cap",
        title:"Market Cap",
        value:token_details['market_cap'],
        is_badge_visible:true
      },
      {
        img:"circulating-supply",
        title:"Circulating Supply",
        value:token_details['circulation'],
        is_badge_visible:false
      },
      {
        img:"total-supply",
        title:"Total Supply",
        value:token_details['total_supply'],
        is_badge_visible:false
      }
    ];
    return details;
  }


  , getTokenHolders: function(contractAddress, pageNumber){
  const oThis = this;
  return new Promise(function (resolve, reject) {

    if ((contractAddress === undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH) &&  contractAddress != '0') {
      reject("invalid input");
      return;
    }

    if (pageNumber === undefined || pageNumber < 0){
      pageNumber = constants.DEFAULT_PAGE_NUMBER;

    }

    oThis._dbInstance.getBrandedTokenIdFromContract(contractAddress)
      .then(function (response) {

        oThis._dbInstance.getAddressesWithBrandedToken(response, pageNumber, constants.DEFAULT_PAGE_SIZE)
          .then(function(holders){

            resolve(holders);
          })
          .catch(function(reason){

          });
      })
      .catch(function (reason) {
        reject(reason);
      });
  });
  }



  /**
   * Get graph data for number of transactions.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} duration  - duration
   *
   * @return {Promise<Object>} List of contract value of transactions
   */
  ,getGraphDataOfNumberOfBrandedTokenTransactions : function(contractAddress, duration){
    const oThis = this;

    return new Promise(function (resolve, reject) {

      if (contractAddress === undefined) {
        reject("invalid input");
        return;
      }

      if (duration === undefined ) {
        duration = "All";
      }

      oThis._dbInstance.getGraphDataForBrandedTokenTransactions(contractAddress)
        .then(function (response) {
          if (response !== undefined && typeof response === 'object' &&  Object.keys(response).length > 0){
            resolve(response[duration]);
          }else{
            resolve();
          }
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }

  /**
   *Get recent token transactions available on utility chain.
   *
   *@return {Promise<Object>} List of pending transactions.
   */
    ,getRecentTokenTransactions : function(pageNumber, pagePaylaod){
    const oThis = this;

    return new Promise(function(resolve, reject){

      if (pageNumber == undefined || !pageNumber || isNaN(pageNumber) || pageNumber < 0) {
        pageNumber = constants.DEFAULT_PAGE_NUMBER;
      }

      oThis._dbInstance.getRecentTokenTransactions(pageNumber,5, pagePaylaod)
        .then(function(response){
          const responseData = {
            response : response,
            pageSize : 5
          }
          resolve(responseData);
        })
        .catch(function(reason){
          reject(reason);
        });

    });
  }

  /**
   *Get list top tokens available on utility chain.
   *
   *@return {Promise<Object>} List of pending transactions.
   */
  ,getTopTokens : function(pageNumber, pagePayload){
    const oThis = this;

    return new Promise(function(resolve, reject){

      if (pageNumber === undefined || !pageNumber || isNaN(pageNumber) || pageNumber < 0) {
        pageNumber = constants.DEFAULT_PAGE_NUMBER;
      }

      oThis._dbInstance.getTopTokens(pageNumber, constants.DEFAULT_PAGE_SIZE, pagePayload)
        .then(function(response){
          const responseData={
            response:response,
            pageSize:constants.DEFAULT_PAGE_SIZE
          }
          resolve(responseData);
        })
        .catch(function(reason){
          reject(reason);
        });

    });
  }




};
