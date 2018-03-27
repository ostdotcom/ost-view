"use strict";


function ConfigHelper() {
  this.contractIdMap = {};
  this.idContractMap = {};
}

/**
 *  To sync up contractId and idContract Map
 */
ConfigHelper.prototype.syncUpContractMap = function (dbInteract) {
  var oThis = this;
  return dbInteract.getBrandedTokenDetails()
    .then(function (btResult) {
      btResult.forEach(function (contractHash) {

        const brandedTokenDetails = {
          id: contractHash.id,
          company_name: contractHash.company_name,
          contract_address: contractHash.contract_address.toLowerCase(),
          company_symbol: contractHash.company_symbol,
          price: contractHash.price,
          symbol_icon: contractHash.symbol_icon
        };

        oThis.contractIdMap[contractHash.contract_address.toLowerCase()] = brandedTokenDetails;
        oThis.idContractMap[contractHash.id] = brandedTokenDetails;
      });
    });
};

/**
 * Get Id of Contract
 * @param {String} contract_address - contract address
 * @returns {*}
 */
ConfigHelper.prototype.getIdOfContract = function (contract_address) {
  var lowerCaseContract_Address = contract_address.toLowerCase();
  if (this.contractIdMap[lowerCaseContract_Address] !== undefined) {
    return this.contractIdMap[lowerCaseContract_Address].id;
  } else {
    return undefined;
  }
};


/**
 * Get Contract of Id
 * @param {Integer} contract_id - Contract Id
 * @returns {*}
 */
ConfigHelper.prototype.getContractOfId = function (contract_id) {
  if (this.idContractMap[contract_id] !== undefined) {
    return this.idContractMap[contract_id].contract_address;
  } else {
    return undefined;
  }
};


/**
 * Get Id of Contract by returning promise
 * @param {Object} dbInteract -  Db interact object
 * @param {String} contractAddress - contract address
 * @returns {Promise}
 */
ConfigHelper.prototype.getIdOfContractByPromise = function (dbInteract, contractAddress) {
  var oThis = this;
  var contractId = oThis.getIdOfContract(contractAddress);
  return new Promise(function (resolve, reject) {
    if (contractId === undefined) {
      oThis.syncUpContractMap(dbInteract)
        .then(function () {
          return resolve(oThis.getIdOfContract(contractAddress))
        }, reject);

    } else {
      return resolve(contractId);
    }
  });
};


/**
 * Get Contract of Id by returning promise
 * @param {Object} dbInteract -  Db interact object
 * @param {Integer} contractId - contract id
 * @returns {Promise}
 */
ConfigHelper.prototype.getContractDetailsOfIdByPromise = function (dbInteract, contractId) {
  var oThis = this;
  var contract = oThis.getContractOfId(contractId);
  return new Promise(function (resolve, reject) {
    if (undefined == contract) {
      oThis.syncUpContractMap(dbInteract)
        .then(function () {
          return resolve(oThis.getContractOfId(contractId));
        }, reject);

    } else {
      return resolve(contract);
    }
  });
};

/**
 * Get Contract of Id by returning promise
 * @param {Object} dbInteract -  Db interact object
 * @param {Integer} contractId - contract id
 * @returns {Promise}
 */
ConfigHelper.prototype.getContractDetailsOfAddressByPromise = function (dbInteract, contractId) {
  var oThis = this;
  var contract = oThis.getContractOfId(contractId);
  if (undefined == contract) {
    this.syncUpContractMap(dbInteract)
      .then(function () {
        return Promise.resolve(oThis.getContractOfId(contract))
      });

  }
  return Promise.resolve(contract);
};

/**
 * Get Hashes of contract addresses
 * @param dbInteract Db interact
 * @param contractAddressArray Contract Address Array
 * @returns {*}
 */
ConfigHelper.prototype.getContractDetailsOfAddressArray = function (dbInteract, contractAddressArray) {
  var oThis = this;
  var result = {};
  return oThis.syncUpContractMap(dbInteract)
    .then(function () {
      contractAddressArray.forEach(function (contractAddress) {
        var contractAddressLower = contractAddress.toLowerCase();
        var value = oThis.contractIdMap[contractAddressLower];
        if (undefined !== value) {
          result[contractAddress] = value;
        } else {
          result[contractAddress] = {};
        }
      });
      return Promise.resolve(result);
    })
    .catch(function (error) {
      logger.error("configHelper#getContractDetailsOfAddressArray :: Error", error);
      return Promise.resolve(result);
    });
};

/**
 * Get Hashes of contract addresses
 * @param dbInteract Db interact
 * @param contractIdArray Contract id Array
 * @returns {*}
 */
ConfigHelper.prototype.getContractDetailsOfIdArray = function (dbInteract, contractIdArray) {
  var oThis = this;
  var result = {};
  return oThis.syncUpContractMap(dbInteract)
    .then(function () {
      contractIdArray.forEach(function (contractId) {
        var value = oThis.idContractMap[contractId];
        if (undefined !== value) {
          result[contractId] = value;
        } else {
          result[contractId] = {};
        }
      });
      return Promise.resolve(result);
    })
    .catch(function (error) {
      logger.error("configHelper#getContractDetailsOfAddressArray :: Error", error);
      return Promise.resolve(result);
    });
};


module.exports = new ConfigHelper();
