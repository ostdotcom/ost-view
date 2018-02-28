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
  , configHelper = require(rootPrefix + '/helpers/configHelper')
  ;

/**
 * @constructor
 *
 * @param {Integer} chainId - chain id to connect to respective geth node and database instance
 */
var contract = module.exports = function (chainId) {
  this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));
};

contract.prototype = {

  /**
   * Get list of Contract ledger for given contract address.
   *
   * @param {String} contractAddress - Contract address
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
   * @param {String} contractAddress - Contract address
   * @param {Integer} page  - Page number
   *
   * @return {Promise<Object>} List of contract transaction
   */
  getContractTransactions: function (contractAddress, page) {
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
  },

  /**
   * Get graph data for value of transactions.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} duration  - duration
   *
   * @return {Promise<Object>} List of contract value of transactions
   */
  getGraphDataOfBrandedTokenValueTransactions: function (contractAddress, duration) {
    const oThis = this;

    return new Promise(function (resolve, reject) {

      if (contractAddress == undefined) {
        reject("invalid input");
        return;
      }

      if (duration == undefined) {
        duration = "All";
      }

      oThis._dbInstance.getGraphDataOfBrandedTokenValueTransactions(contractAddress)
        .then(function (response) {
          resolve(response[duration]);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  },


  /**
   * Get graph data for number of transactions.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} duration  - duration
   *
   * @return {Promise<Object>} List of contract value of transactions
   */
  getGraphDataOfNumberOfBrandedTokenTransactions: function (contractAddress, duration) {
    const oThis = this;

    return new Promise(function (resolve, reject) {

      if (contractAddress == undefined) {
        reject("invalid input");
        return;
      }

      if (duration == undefined) {
        duration = "All";
      }

      oThis._dbInstance.getGraphDataOfNumberOfBrandedTokenTransactions(contractAddress)
        .then(function (response) {
          if (response !== undefined && typeof response == 'object' && Object.keys(response).length > 0) {
            resolve(response[duration]);
          } else {
            resolve();
          }
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  },

  /**
   * Get graph data for transaction by type.
   *
   * @param {String} contractAddress - Contract address
   * @param {Integer} duration  - duration
   *
   * @return {Promise<Object>} List of contract transactions by type
   */
  getGraphDataForBrandedTokenTransactionsByType: function (contractAddress, duration) {
    const oThis = this;

    return new Promise(function (resolve, reject) {

      if (contractAddress == undefined) {
        reject("invalid input");
        return;
      }

      if (duration == undefined) {
        duration = "All";
      }

      configHelper.getIdOfContractByPromise(oThis._dbInstance, contractAddress)
        .then(function (contractId) {
          if (contractId === undefined) {
            return reject('unknown contract address :: ' + contractAddress);
          }

          oThis._dbInstance.getGraphDataForBrandedTokenTransactionsByType(contractId)
            .then(function (response) {
              if (response !== undefined && typeof response == 'object' && Object.keys(response).length > 0) {
                resolve(response[duration]);
              } else {
                resolve();
              }
            })
            .catch(function (reason) {
              reject(reason);
            });

        });

    });
  },

  /**
   * Get top users in contract address.
   *
   * @return {Promise<Object>} List of top users in contract address
   *
   */
  getBrandedTokenTopUsers: function (contractAddress) {
    const oThis = this;

    return new Promise(function (resolve, reject) {
      configHelper.getIdOfContractByPromise(oThis._dbInstance, contractAddress)
        .then(function (contractId) {
          if (contractId === undefined) {
            return reject('unknown contract address :: ' + contractAddress);
          }

          oThis._dbInstance.getBrandedTokenTopUsers(contractId)
            .then(function (response) {
              resolve(response);
            })
            .catch(function (reason) {
              reject(reason);
            });
        });
    });
  },

  /**
   * Get top users in contract address.
   *
   * @return {Promise<Object>} List of top users in contract address
   */
  getOstSupply: function (contractAddress) {
    const oThis = this;

    return new Promise(function (resolve, reject) {

      oThis._dbInstance.getOstSupply(contractAddress)
        .then(function (response) {
          resolve(response);
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  }

};
