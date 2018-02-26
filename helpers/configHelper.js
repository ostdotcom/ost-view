"use strict";


function ConfigHelper() {
    this.contractIdMap = {};
    this.idContractMap = {};
}

/**
 *  To sync up contractId and idContract Map
 */
ConfigHelper.prototype.syncUpContractMap = function(dbInteract) {
    var oThis = this;
    return dbInteract.getBrandedTokenDetails()
        .then(function(btResult) {
            btResult.forEach(function(contractHash){
                oThis.contractIdMap[contractHash.contract_address] = contractHash.id;
                oThis.idContractMap[contractHash.id] = contractHash.contract_address;
            });
        });
};

/**
 * Get Id of Contract
 * @param {String} contract_address - contract address
 * @returns {*}
 */
ConfigHelper.prototype.getIdOfContract = function(contract_address) {
    return this.contractIdMap[contract_address];
};

/**
 * Get Id of Contract by returning promise
 * @param {Object} dbInteract -  Db interact object
 * @param {String} contractAddress - contract address
 * @returns {Promise}
 */
ConfigHelper.prototype.getIdOfContractByPromise = function(dbInteract, contractAddress) {
    var oThis = this;
    var contractId = oThis.getIdOfContract(contractAddress);
    return new Promise(function(resolve, reject){
        if (undefined == contractId) {
            oThis.syncUpContractMap(dbInteract)
                .then(function(){
                    return resolve(oThis.getIdOfContract(contractAddress))
                }, reject);

        } else {
            return resolve(contractId);
        }
    });

};

/**
 * Get Contract of Id
 * @param {Integer} contract_id - Contract Id
 * @returns {*}
 */
ConfigHelper.prototype.getContractOfId = function(contract_id) {
    return this.idContractMap[contract_id];
};

/**
 * Get Contract of Id by returning promise
 * @param {Object} dbInteract -  Db interact object
 * @param {Integer} contractId - contract id
 * @returns {Promise}
 */
ConfigHelper.prototype.getContractOfIdByPromise = function(dbInteract, contractId) {
    var oThis = this;
    var contract = oThis.getContractOfId(contractId);
    return new Promise(function(resolve, reject){
        if (undefined == contract) {
            oThis.syncUpContractMap(dbInteract)
                .then(function(){
                    return resolve(oThis.getContractOfId(contractId));
                },reject);

        } else {
            return resolve(contractId);
        }
    });
};

module.exports = new ConfigHelper();